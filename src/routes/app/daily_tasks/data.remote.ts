import { query, command, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { z } from 'zod/v4';
import { getUserProfile } from '$lib/supabase/queries';
import { type UserDailyTask } from '$lib/models/tasks.types';

export const getDayliTaskForUser = query(async () => {
	const supabase = createServerClient();
	try {
		const todayDate = new Date().toISOString().split('T')[0];
		const profile = await getUserProfile();

		const { data: dailyTasks, error } = await supabase
			.from('user_daily_tasks')
			.select(
				`
				*,
				task_items (*)
			`
			)
			.eq('task_date', todayDate)
			.eq('user_id', profile.id)
			.overrideTypes<UserDailyTask[]>();

		const sorted = dailyTasks?.sort((a, b) =>
			a.task_items.scheduled_time.localeCompare(b.task_items.scheduled_time)
		);

		return {
			success: true,
			message: 'Επιτυχία',
			tasks: sorted || []
		};
	} catch (err) {
		console.error('[getDayliTaskForUser] Error fethcing dayli task for user: ', err);
		return {
			success: false,
			message: 'Σφάλμα κάτα την ανάκτηση δεδομένων',
			tasks: []
		};
	}
});

const updateTaskSchema = z.object({
	id: z.uuid(),
	completed: z.boolean(),
	completed_at: z.string()
});

export const updateDayliTaskForUser = command(updateTaskSchema, async (data) => {
	const supabase = createServerClient();
	try {
		// Fetch the task with task_items to check requires_photo
		const { data: task, error: taskError } = await supabase
			.from('user_daily_tasks')
			.select(
				`
				*,
				task_items (requires_photo)
			`
			)
			.eq('id', data.id)
			.single();

		if (taskError) {
			console.error('[updateDayliTaskForUser] Error fetching task: ', taskError);
			return {
				success: false,
				message: 'Σφάλμα κάτα διάρκεια ενημέρωσης εργασίας'
			};
		}

		// If uncompleting (completed = false) AND task requires photo AND has a photo_url
		if (!data.completed && task?.task_items?.requires_photo && task?.photo_url) {
			// Extract the file path from the URL
			// URL format: https://xxx.supabase.co/storage/v1/object/public/daily-task-photos/{user_id}/{task_id}/{filename}
			const photoUrl = task.photo_url;
			const bucketPath = photoUrl.split('/daily-task-photos/')[1];

			if (bucketPath) {
				// Delete the photo from storage
				const { error: deleteError } = await supabase.storage
					.from('daily-task-photos')
					.remove([bucketPath]);

				if (deleteError) {
					console.error('[updateDayliTaskForUser] Error deleting photo: ', deleteError);
					// Continue anyway - don't fail the whole operation for a storage cleanup issue
				}
			}
		}

		// Prepare update data
		const updateData: {
			completed: boolean;
			completed_at: string | null;
			photo_url?: null;
		} = {
			completed: data.completed,
			completed_at: data.completed ? data.completed_at : null
		};

		// If uncompleting and had a photo, clear the photo_url
		if (!data.completed && task?.task_items?.requires_photo && task?.photo_url) {
			updateData.photo_url = null;
		}

		const { error: updateError } = await supabase
			.from('user_daily_tasks')
			.update(updateData)
			.eq('id', data.id);

		if (updateError) {
			console.error('[updateDayliTaskForUser] Error updating task: ', updateError);
			return {
				success: false,
				message: 'Σφάλμα κάτα διάρκεια ενημέρωσης εργασίας'
			};
		}

		return {
			success: true,
			message: 'Επιτυχία ενημέρωσης εργασίας'
		};
	} catch (err) {
		console.error('[updateDayliTaskForUser] Error updating task: ', err);
		return {
			success: false,
			message: 'Σφάλμα κάτα διάρκεια ενημέρωσης εργασίας'
		};
	}
});

// ============================================
// REPLACE the uploadTaskPhoto in: src/routes/app/daily_tasks/data.remote.ts
// ============================================

// Change the schema and use 'form' instead of 'command'
const uploadTaskPhotoSchema = z.object({
	taskId: z.string().uuid(),
	photoFile: z
		.instanceof(File)
		.refine((file) => file.size > 0, 'File cannot be empty.')
		.refine((file) => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.')
		.refine(
			(file) =>
				['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'].includes(file.type),
			'Only image files are allowed.'
		)
});

export const uploadTaskPhoto = form(uploadTaskPhotoSchema, async (data) => {
	const supabase = createServerClient();
	try {
		const profile = await getUserProfile();

		// Create file path: {user_id}/{task_id}/{filename}
		const fileExt = data.photoFile.name.split('.').pop() || 'jpg';
		const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
		const filePath = `${profile.id}/${data.taskId}/${fileName}`;

		// Upload to storage
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('daily-task-photos')
			.upload(filePath, data.photoFile, {
				cacheControl: '3600',
				upsert: false
			});

		if (uploadError) {
			console.error('[uploadTaskPhoto] Upload error:', uploadError);
			return {
				success: false,
				message: 'Σφάλμα κατά το ανέβασμα της φωτογραφίας'
			};
		}

		// Get public URL
		const { data: urlData } = supabase.storage
			.from('daily-task-photos')
			.getPublicUrl(uploadData.path);

		// Update task with photo URL
		const { error: updateError } = await supabase
			.from('user_daily_tasks')
			.update({
				photo_url: urlData.publicUrl,
				completed: true,
				completed_at: new Date().toISOString()
			})
			.eq('id', data.taskId);

		if (updateError) {
			console.error('[uploadTaskPhoto] Update error:', updateError);
			// Try to delete the uploaded file since update failed
			await supabase.storage.from('daily-task-photos').remove([filePath]);
			return {
				success: false,
				message: 'Σφάλμα κατά την ενημέρωση της εργασίας'
			};
		}

		return {
			success: true,
			message: 'Η φωτογραφία αποθηκεύτηκε επιτυχώς',
			photoUrl: urlData.publicUrl
		};
	} catch (err) {
		console.error('[uploadTaskPhoto] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την αποθήκευση της φωτογραφίας'
		};
	}
});

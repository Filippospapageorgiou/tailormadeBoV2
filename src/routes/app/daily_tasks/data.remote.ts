import { query, command, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { z } from 'zod/v4';
import { getUserProfile } from '$lib/supabase/queries';
import {
	type UserDailyTask,
	type UserWeeklyTask,
	type UserMonthlyTask
} from '$lib/models/tasks.types';

// ======================== HELPERS ========================

/** Given any date string, return a range that captures the Monday week_start_date */
function getWeekSearchRange(dateStr: string): { rangeStart: string; rangeEnd: string } {
	const d = new Date(dateStr);
	const sixDaysBefore = new Date(d);
	sixDaysBefore.setDate(d.getDate() - 6);
	return {
		rangeStart: sixDaysBefore.toISOString().split('T')[0],
		rangeEnd: dateStr
	};
}

// ======================== DAILY TASKS ========================

export const getDailyTasksForUser = query(async () => {
	const supabase = createServerClient();
	try {
		const todayDate = new Date().toISOString().split('T')[0];
		const profile = await getUserProfile();

		const { data: dailyTasks, error } = await supabase
			.from('user_daily_tasks')
			.select(`*, task_items (*)`)
			.eq('task_date', todayDate)
			.eq('user_id', profile.id)
			.overrideTypes<UserDailyTask[]>();

		if (error) {
			console.error('[getDailyTasksForUser] Error:', error);
			return { success: false, message: 'Σφάλμα ανάκτησης ημερήσιων εργασιών', tasks: [] };
		}

		const sorted = dailyTasks?.sort((a, b) =>
			a.task_items.scheduled_time.localeCompare(b.task_items.scheduled_time)
		);

		return { success: true, message: 'Επιτυχία', tasks: sorted || [] };
	} catch (err) {
		console.error('[getDailyTasksForUser] Error:', err);
		return { success: false, message: 'Σφάλμα ανάκτησης δεδομένων', tasks: [] };
	}
});

// ======================== WEEKLY TASKS ========================

export const getWeeklyTasksForUser = query(async () => {
	const supabase = createServerClient();
	try {
		const todayDate = new Date().toISOString().split('T')[0];
		const profile = await getUserProfile();
		const { rangeStart, rangeEnd } = getWeekSearchRange(todayDate);

		const { data: weeklyTasks, error } = await supabase
			.from('user_weekly_tasks')
			.select(`*, task_items (*)`)
			.gte('week_start_date', rangeStart)
			.lte('week_start_date', rangeEnd)
			.eq('user_id', profile.id)
			.overrideTypes<UserWeeklyTask[]>();

		if (error) {
			console.error('[getWeeklyTasksForUser] Error:', error);
			return { success: false, message: 'Σφάλμα ανάκτησης εβδομαδιαίων εργασιών', tasks: [] };
		}

		const sorted = weeklyTasks?.sort((a, b) =>
			(a.task_items.scheduled_time || '').localeCompare(b.task_items.scheduled_time || '')
		);

		return { success: true, message: 'Επιτυχία', tasks: sorted || [] };
	} catch (err) {
		console.error('[getWeeklyTasksForUser] Error:', err);
		return { success: false, message: 'Σφάλμα ανάκτησης δεδομένων', tasks: [] };
	}
});

// ======================== MONTHLY TASKS ========================

export const getMonthlyTasksForUser = query(async () => {
	const supabase = createServerClient();
	try {
		const today = new Date();
		const monthDate = today.toISOString().slice(0, 7) + '-01'; // e.g. "2026-02-01"
		const profile = await getUserProfile();

		const { data: monthlyTasks, error } = await supabase
			.from('user_monthly_tasks')
			.select(`*, task_items (*)`)
			.eq('month_date', monthDate)
			.eq('user_id', profile.id)
			.overrideTypes<UserMonthlyTask[]>();

		if (error) {
			console.error('[getMonthlyTasksForUser] Error:', error);
			return { success: false, message: 'Σφάλμα ανάκτησης μηνιαίων εργασιών', tasks: [] };
		}

		const sorted = monthlyTasks?.sort((a, b) =>
			(a.task_items.scheduled_time || '').localeCompare(b.task_items.scheduled_time || '')
		);

		return { success: true, message: 'Επιτυχία', tasks: sorted || [] };
	} catch (err) {
		console.error('[getMonthlyTasksForUser] Error:', err);
		return { success: false, message: 'Σφάλμα ανάκτησης δεδομένων', tasks: [] };
	}
});

// ======================== UPDATE TASK ========================

const updateTaskSchema = z.object({
	id: z.uuid(),
	completed: z.boolean(),
	completed_at: z.string(),
	frequency: z.enum(['daily', 'weekly', 'monthly'])
});

export const updateTaskForUser = command(updateTaskSchema, async (data) => {
	const supabase = createServerClient();

	// Determine table based on frequency
	const tableMap = {
		daily: 'user_daily_tasks',
		weekly: 'user_weekly_tasks',
		monthly: 'user_monthly_tasks'
	} as const;

	const table = tableMap[data.frequency];

	try {
		// Fetch the task to check requires_photo
		const { data: task, error: taskError } = await supabase
			.from(table)
			.select(`*, task_items (requires_photo)`)
			.eq('id', data.id)
			.single();

		if (taskError) {
			console.error('[updateTaskForUser] Fetch error:', taskError);
			return { success: false, message: 'Σφάλμα κάτα διάρκεια ενημέρωσης εργασίας' };
		}

		// If uncompleting and task has photo, delete it from storage
		if (!data.completed && task?.task_items?.requires_photo && task?.photo_url) {
			const bucketPath = task.photo_url.split('/daily-task-photos/')[1];
			if (bucketPath) {
				const { error: deleteError } = await supabase.storage
					.from('daily-task-photos')
					.remove([bucketPath]);
				if (deleteError) {
					console.error('[updateTaskForUser] Photo delete error:', deleteError);
				}
			}
		}

		const updateData: { completed: boolean; completed_at: string | null; photo_url?: null } = {
			completed: data.completed,
			completed_at: data.completed ? data.completed_at : null
		};

		if (!data.completed && task?.task_items?.requires_photo && task?.photo_url) {
			updateData.photo_url = null;
		}

		const { error: updateError } = await supabase
			.from(table)
			.update(updateData)
			.eq('id', data.id);

		if (updateError) {
			console.error('[updateTaskForUser] Update error:', updateError);
			return { success: false, message: 'Σφάλμα κάτα διάρκεια ενημέρωσης εργασίας' };
		}

		return { success: true, message: 'Επιτυχία ενημέρωσης εργασίας' };
	} catch (err) {
		console.error('[updateTaskForUser] Error:', err);
		return { success: false, message: 'Σφάλμα κάτα διάρκεια ενημέρωσης εργασίας' };
	}
});

// ======================== UPLOAD PHOTO ========================

const uploadTaskPhotoSchema = z.object({
	taskId: z.string().uuid(),
	frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
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

	const tableMap = {
		daily: 'user_daily_tasks',
		weekly: 'user_weekly_tasks',
		monthly: 'user_monthly_tasks'
	} as const;

	const table = tableMap[data.frequency];

	try {
		const profile = await getUserProfile();

		const fileExt = data.photoFile.name.split('.').pop() || 'jpg';
		const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
		const filePath = `${profile.id}/${data.taskId}/${fileName}`;

		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('daily-task-photos')
			.upload(filePath, data.photoFile, {
				cacheControl: '3600',
				upsert: false
			});

		if (uploadError) {
			console.error('[uploadTaskPhoto] Upload error:', uploadError);
			return { success: false, message: 'Σφάλμα κατά το ανέβασμα της φωτογραφίας' };
		}

		const { data: urlData } = supabase.storage
			.from('daily-task-photos')
			.getPublicUrl(uploadData.path);

		const { error: updateError } = await supabase
			.from(table)
			.update({
				photo_url: urlData.publicUrl,
				completed: true,
				completed_at: new Date().toISOString()
			})
			.eq('id', data.taskId);

		if (updateError) {
			console.error('[uploadTaskPhoto] Update error:', updateError);
			await supabase.storage.from('daily-task-photos').remove([filePath]);
			return { success: false, message: 'Σφάλμα κατά την ενημέρωση της εργασίας' };
		}

		return {
			success: true,
			message: 'Η φωτογραφία αποθηκεύτηκε επιτυχώς',
			photoUrl: urlData.publicUrl
		};
	} catch (err) {
		console.error('[uploadTaskPhoto] Error:', err);
		return { success: false, message: 'Σφάλμα κατά την αποθήκευση της φωτογραφίας' };
	}
});
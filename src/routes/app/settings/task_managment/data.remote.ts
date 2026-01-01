import { query, command, form, prerender } from '$app/server';
import { createServerClient, createAdminClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { check, z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import {
	getAllProfilesSameOrg,
	getUserOrgId,
	getUserProfile,
	getUserProfileWithRoleCheck
} from '$lib/supabase/queries';
import {
	type TaskItem,
	type TaskTemplate,
	type TaskTemplateWithTasks,
	type UserDailyTask
} from '$lib/models/tasks.types';
// ======================== AUTH ACCESS CHECK ==============

export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([1, 2]);
	return {
		success: true,
		profile
	};
});

export const getAllUsers = query(z.string(), async (selectedDate) => {
	const supabase = createServerClient();
	try {
		const org_id = await getUserOrgId();
		const users = await getAllProfilesSameOrg(org_id);

		const { data: dailyTasks, error } = await supabase
			.from('user_daily_tasks')
			.select(
				`
				*,
				task_items (*)
			`
			)
			.eq('task_date', selectedDate)
			.in(
				'user_id',
				users.map((u) => u.id)
			);

		if (error) {
			console.error('[getAllUsers] Error fecthing all users from same org: ', error);
			return {
				users: [],
				success: false,
				message: 'Σφάλμα κάτα την ανάκτηση δεδομένων'
			};
		}

		//create map of user_id to their tasks

		const userWithTasks = new Map<string, UserDailyTask[]>();

		//initialize with empty array for all users
		users.forEach((user) => {
			userWithTasks.set(user.id, []);
		});

		//populate the map with the tasks
		dailyTasks?.forEach((task) => {
			const userTasks = userWithTasks.get(task.user_id) || [];
			userTasks.push(task);
			userWithTasks.set(task.user_id, userTasks);
		});

		// Convert map to array format if needed
		const usersWithTasksArray = users.map((user) => ({
			...user,
			dailyTasks: userWithTasks.get(user.id) || []
		}));

		

		return {
			users: usersWithTasksArray ?? [],
			success: true,
			message: 'Επιτυχία'
		};
	} catch (err) {
		console.error('[getAllUsers] Error fecthing all users from same org: ', err);
		return {
			users: [],
			success: false,
			message: 'Σφάλμα κάτα την ανάκτηση δεδομένων'
		};
	}
});

export const getAllTemplatesTask = query(async () => {
	const supabase = createServerClient();
	const org_id = await getUserOrgId();
	try {
		const { data: taskTemplatesWithTasks, error: templateError } = await supabase
			.from('task_templates')
			.select(`*,task_items (*)`)
			.eq('org_id', org_id)
			.overrideTypes<TaskTemplateWithTasks[]>();

		if (templateError) {
			return {
				taskTemplatesWithTasks: [],
				success: false,
				message: 'Σφάλμα κάτα την ανάκτηση δεδομένων'
			};
		}
		return {
			taskTemplatesWithTasks,
			success: true,
			message: 'Επιτυχία στην ανακτήση δεδομένων'
		};
	} catch (err) {
		console.error('[getAllTemplatesTask] Error fetching template tasks: ', err);
		return {
			success: false,
			message: 'Σφάλμα κάτα την ανάκτηση δεδομένων'
		};
	}
});

const TaskTemplateSchema = z.object({
	id: z.uuid().optional(),
	name: z.string().trim().min(1, { message: 'Name is required' }),
	description: z.string().trim().min(1, { message: 'Description is required' }),
	is_active: z.string().refine((val) => {
		if (typeof val === 'string') {
			if (val.toLowerCase() === 'true' || val === 'on') return true;
			if (val.toLowerCase() === 'false') return false;
		}
		return Boolean(val);
	})
});

const DeleteSchema = z.object({
	id: z.string()
});

export const addTaskTemplate = form(TaskTemplateSchema, async (data) => {
	const supabase = createServerClient();
	try {
		const profile = await getUserProfile();
		// Fixed table name typo: task_templated -> task_templates
		const { error } = await supabase.from('task_templates').insert({
			org_id: profile.org_id,
			name: data.name,
			description: data.description,
			is_active: data.is_active,
			created_by: profile.id
		});

		if (error) throw error;

		return {
			success: true,
			message: 'Το πρότυπο δημιουργήθηκε με επιτυχία' // Fixed typo: προτωτύπο
		};
	} catch (err) {
		console.error('[addTaskTemplate] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την δημιουργία προτύπου'
		};
	}
});

export const updateTaskTemplate = form(TaskTemplateSchema, async (data) => {
	const supabase = createServerClient();
	if (!data.id) return { success: false, message: 'Missing Template ID' };
	const profile = await getUserProfile();
	try {
		const { error } = await supabase
			.from('task_templates')
			.update({
				name: data.name,
				description: data.description,
				is_active: data.is_active,
				created_by: profile.id
			})
			.eq('id', data.id);

		if (error) throw error;

		return {
			success: true,
			message: 'Το πρότυπο ενημερώθηκε με επιτυχία'
		};
	} catch (err) {
		console.error('[updateTaskTemplate] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ενημέρωση του προτύπου'
		};
	}
});

export const deleteTaskTemplate = command(DeleteSchema, async (data) => {
	const supabase = createServerClient();
	try {
		const { error } = await supabase.from('task_templates').delete().eq('id', data.id);

		if (error) throw error;

		return {
			success: true,
			message: 'Το πρότυπο διαγράφηκε με επιτυχία'
		};
	} catch (err) {
		console.error('[deleteTaskTemplate] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την διαγραφή του προτύπου'
		};
	}
});

const TaskItemSchema = z.object({
	id: z.uuid().optional(),
	template_id: z.uuid(),
	title: z.string().trim().min(1, { message: 'Title is required' }),
	description: z.string().trim().optional(),

	position: z
		.string()
		.default('0')
		.transform((val) => {
			const parsed = parseInt(val, 10);
			return isNaN(parsed) ? 0 : parsed;
		}),
	scheduled_time: z.string(),
	estimated_minutes: z
		.string()
		.optional()
		.transform((val) => {
			if (!val || val.trim() === '') return null;
			const parsed = parseInt(val, 10);
			return isNaN(parsed) ? null : parsed;
		}),

	requires_photo: z
		.string()
		.optional()
		.default('false')
		.transform((val) => {
			return val.toLowerCase() === 'true' || val === 'on';
		})
});
const DeleteItemSchema = z.object({
	id: z.string()
});

// ======================== TASK ITEM ACTIONS ========================

export const addTaskItem = form(TaskItemSchema, async (data) => {
	const supabase = createServerClient();
	try {
		const { error } = await supabase.from('task_items').insert({
			template_id: data.template_id,
			title: data.title,
			description: data.description,
			position: data.position,
			requires_photo: data.requires_photo,
			estimated_minutes: data.estimated_minutes
		});

		if (error) throw error;

		return {
			success: true,
			message: 'Το αντικείμενο προστέθηκε με επιτυχία'
		};
	} catch (err) {
		console.error('[addTaskItem] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την προσθήκη αντικειμένου'
		};
	}
});

export const updateTaskItem = form(TaskItemSchema, async (data) => {
	const supabase = createServerClient();
	if (!data.id) return { success: false, message: 'Missing Item ID' };

	try {
		const { error } = await supabase
			.from('task_items')
			.update({
				title: data.title,
				description: data.description,
				position: data.position,
				requires_photo: data.requires_photo,
				estimated_minutes: data.estimated_minutes
			})
			.eq('id', data.id);

		if (error) throw error;

		return {
			success: true,
			message: 'Το αντικείμενο ενημερώθηκε με επιτυχία'
		};
	} catch (err) {
		console.error('[updateTaskItem] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ενημέρωση του αντικειμένου'
		};
	}
});

export const deleteTaskItem = command(DeleteItemSchema, async (data) => {
	const supabase = createServerClient();
	try {
		const { error } = await supabase.from('task_items').delete().eq('id', data.id);

		if (error) throw error;

		return {
			success: true,
			message: 'Το αντικείμενο διαγράφηκε με επιτυχία'
		};
	} catch (err) {
		console.error('[deleteTaskItem] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την διαγραφή του αντικειμένου'
		};
	}
});

const TaskItemSchemaForTemplate = z.object({
	id: z.string().optional(),
	title: z.string().trim().min(1, { message: 'Title is required' }),
	description: z.string().trim().optional(),
	position: z
		.string()
		.default('0')
		.transform((val) => {
			const parsed = parseInt(val, 10);
			return isNaN(parsed) ? 0 : parsed;
		}),
	scheduled_time: z.string(),
	estimated_minutes: z
		.string()
		.optional()
		.transform((val) => {
			if (!val || val.trim() === '') return null;
			const parsed = parseInt(val, 10);
			return isNaN(parsed) ? null : parsed;
		}),
	requires_photo: z
		.string()
		.optional()
		.transform((val) => val === 'true' || 'false')
});

const TaskTemplateSchemaWithTasks = z.object({
	id: z.string().optional(),
	template_id: z.string().optional(),
	name: z.string().trim().min(1, 'Το όνομα είναι υποχρεωτικό'),
	description: z.string().trim().min(1, 'Η περιγραφή είναι υποχρεωτική'),
	is_active: z
		.string()
		.optional()
		.transform((val) => val === 'true' || 'false'),
	task_items: z.array(TaskItemSchemaForTemplate).default([])
});

export const addTaskTemplateWithTasks = form(TaskTemplateSchemaWithTasks, async (data) => {
	const supabase = createServerClient();
	const profile = await getUserProfile();
	const { data: template, error: tError } = await supabase
		.from('task_templates')
		.insert({
			name: data.name,
			description: data.description,
			is_active: data.is_active,
			org_id: profile.org_id,
			created_by: profile.id
		})
		.select()
		.single();

	if (tError) throw tError;

	// 2. Insert the Tasks with the new template_id
	if (data.task_items.length > 0) {
		const tasksToInsert = data.task_items.map((item) => ({
			...item,
			template_id: template.id
		}));

		const { error: iError } = await supabase.from('task_items').insert(tasksToInsert);
		if (iError) {
			console.error('error isnerting task items: ', tError);
			throw tError;
		}
	}

	return { success: true };
});

export const updateTemplateWithTasks = form(TaskTemplateSchemaWithTasks, async (data) => {
	const supabase = createServerClient();
	if (!data) throw new Error('Template ID is required for updates');

	const { error: tError } = await supabase
		.from('task_templates')
		.update({
			name: data.name,
			description: data.description,
			is_active: data.is_active
		})
		.eq('id', data.id);

	if (tError) {
		console.error('error: ', tError);
		throw tError;
	}

	//We get the IDs of tasks that should stay/be updated
	const currentTaskIds = data.task_items.map((item) => item.id).filter((id): id is string => !!id);

	const { error: dError } = await supabase
		.from('task_items')
		.delete()
		.eq('template_id', data.id)
		.not('id', 'in', `(${currentTaskIds.join(',')})`);
	if (dError) {
		console.error('error: ', dError);
		throw dError;
	}

	// 3. Upsert the tasks (Insert new ones, Update existing ones)
	if (data.task_items.length > 0) {
		const tasksToUpsert = data.task_items.map((item) => ({
			...item,
			template_id: data.id // Link to parent
		}));

		const { error: uError } = await supabase
			.from('task_items')
			.upsert(tasksToUpsert, { onConflict: 'id' });

		if (uError) {
			console.error(uError);
			throw uError;
		}
	}

	return { success: true };
});

const addUserDailyTasksSchema = z.object({
	id: z.string().optional(),
	user_id: z.string(),
	task_item_ids: z.array(z.string()).default([]),
	task_date: z.string(),
	assigned_by: z.string(),
	notes: z.string()
});

export const addUserDailyTasks = command(addUserDailyTasksSchema, async (data) => {
	const supabase = createServerClient();
	try {
		// 1. Transform the array of IDs into an array of database rows
		const rowsToInsert = data.task_item_ids.map((task_id) => ({
			user_id: data.user_id,
			task_item_id: task_id, // Ensure this column name matches your DB
			task_date: data.task_date,
			assigned_by: data.assigned_by,
			notes: data.notes
		}));

		// 2. Perform a single batch insert
		const { data: insertData, error: insertError } = await supabase
			.from('user_daily_tasks')
			.insert(rowsToInsert);

		if (insertError) {
			console.error('[addUserDailyTasks] Error while adding user tasks: ', insertError);
			return {
				success: false,
				message: 'Σφάλμα κατά την δημιουργία tasks'
			};
		}

		return {
			success: true, // Fixed typo: suceess -> success
			message: 'Επιτυχία στην πρόσθεση εργασίων'
		};
	} catch (error) {
		console.error('[addUserDailyTasks] Error while adding user tasks: ', error);
		return {
			success: false,
			message: 'Σφάλμα κατά την δημιουργία tasks'
		};
	}
});

const addCustomDayliTaskSchema = z.object({
	user_id: z.string(),
	task_date: z.string(),
	title: z.string(),
	description: z.string(),
	scheduled_time: z.string(),
	estimated_minutes: z.number(),
	requires_photo: z.boolean()
});

export const addCustomDayliTask = command(addCustomDayliTaskSchema, async (data) => {
	const supabase = createAdminClient();
	const user = await getUserProfile();
	try {
		const { data: task, error: insertError } = await supabase
			.from('task_items')
			.insert({
				title: data.title,
				description: data.description,
				requires_photo: data.requires_photo,
				estimated_minutes: data.estimated_minutes,
				scheduled_time: data.scheduled_time
			})
			.select()
			.single();

		if (insertError) {
			console.error('[addCustomDayliTask] Error trying to add custom task to user: ', insertError);
			return {
				success: false,
				message: 'Σφάλμα κάτα την πρόσθεση εργασίας'
			};
		}

		if (task) {
			const { data: insertData, error: insertErrorUser } = await supabase
				.from('user_daily_tasks')
				.insert({
					user_id: data.user_id,
					task_item_id: task.id,
					task_date: data.task_date,
					assigned_by: user.id
				});

			if (insertErrorUser) {
				console.error(
					'[addCustomDayliTask] Error trying to add custom task to user: ',
					insertErrorUser
				);
				return {
					success: false,
					message: 'Σφάλμα κάτα την πρόσθεση εργασίας'
				};
			}
		}

		return {
			success: true,
			message: 'Η εργασία προσθέθηκε με επιτυχία.'
		};
	} catch (err) {
		console.error('[addCustomDayliTask] Error trying to add custom task to user: ', err);
		return {
			success: false,
			message: 'Σφάλμα κάτα την πρόσθεση εργασίας'
		};
	}
});


export const deleteDailyTask = command(DeleteItemSchema, async (data) => {
    const supabase = createServerClient();
    try {
        // Use .select() or check the count to see if something happened
        const { error, count } = await supabase
            .from('user_daily_tasks')
            .delete({ count: 'exact' }) // Add this to get the count
            .eq('id', data.id);

        if (error) {
            console.error('[deleteDailyTask] DB Error:', error);
            return { success: false, message: 'Σφάλμα βάσης δεδομένων' };
        }

        // If count is 0, nothing was deleted (likely RLS or wrong ID)
        if (count === 0) {
            console.warn('[deleteDailyTask] No rows deleted. Check RLS or ID:', data.id);
            return { 
                success: false, 
                message: 'Η εργασία δεν βρέθηκε ή δεν έχετε δικαίωμα διαγραφής' 
            };
        }

        return { success: true, message: 'Επιτυχής διαγραφή εργασίας' };
    } catch (err) {
        return { success: false, message: 'Σφάλμα κατά την επικοινωνία' };
    }
});
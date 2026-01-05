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

		return {
			success: true,
			message: 'Επιτυχία',
			tasks: dailyTasks || []
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
		const { data: Task, error: TaskError } = await supabase
			.from('user_daily_tasks')
			.select('*')
			.eq('id', data.id);
		if (TaskError) {
			console.error('[updateDayliTaskForUser] Error updating dayli task: ',TaskError);
			return {
				success: false,
				message: 'Σφάλμα κάτα διάρκεια ενημέρωσης εργασίας'
			};
		}


        const { error:updateError } = await supabase 
            .from('user_daily_tasks')
            .update({
                completed:data.completed,
                completed_at:data.completed_at
            })
            .eq('id',data.id);
        
        if (updateError) {
			console.error('[updateDayliTaskForUser] Error updating dayli task: ',updateError);
			return {
				success: false,
				message: 'Σφάλμα κάτα διάρκεια ενημέρωσης εργασίας'
			};
		}

        return{
            success:true,
            message:'Επυτηχία ενημέρωσης εργασίας'
        }

	} catch (err) {
		console.error('[updateDayliTaskForUser] Error updating dayli task: ',err);
		return {
			success: false,
			message: 'Σφάλμα κάτα διάρκεια ενημέρωσης εργασίας'
		};
	}
});

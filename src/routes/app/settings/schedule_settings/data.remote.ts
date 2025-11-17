import { query, command, form, prerender } from '$app/server';
import { createServerClient, createAdminClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Profile } from '$lib/models/database.types';
import type { WeeklySchedule } from '$lib/models/schedule.types';
import { SCHEDULE_STATUS } from '$lib/models/schedule.types';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';

// ======================== AUTH ACCESS CHECK ==============

export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([1, 2]); // 1 = admin, 2 = manager
	return { profile };
});

// ======================== SCHEDULE LIST QUERIES ==============

/**
 * Get all weekly schedules (list view)
 */
export const getSchedules = query(async () => {
	const supabase = createServerClient();

	const { data: schedules, error: schedulesError } = await supabase
		.from('weekly_schedules')
		.select('*')
		.order('week_start_date', { ascending: false })
		.overrideTypes<WeeklySchedule[]>();

	if (schedulesError) {
		console.error('Error fetching schedules:', schedulesError);
		return {
			success: false,
			message: 'Error fetching schedules',
			schedules: []
		};
	}

	return {
		success: true,
		schedules: schedules ?? []
	};
});

// ======================== SCHEDULE CRUD COMMANDS ==============

/**
 * Create a new weekly schedule
 */
const createScheduleSchema = z.object({
	week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
	week_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
	year: z.number().int().min(2024).max(2100)
});

export const createSchedule = command(createScheduleSchema, async (scheduleData) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	// get orgId from admin user
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('org_id')
		.eq('id', user.id)
		.single();
	if (profileError) {
		console.error('Error fecthing profile info: ', profileError);
		return {
			success: false,
			message: 'Failed to create schedule'
		};
	}

	try {
		const { data: newSchedule, error: insertError } = await supabase
			.from('weekly_schedules')
			.insert({
				org_id: profile.org_id,
				week_start_date: scheduleData.week_start_date,
				week_end_date: scheduleData.week_end_date,
				year: scheduleData.year,
				status: SCHEDULE_STATUS.DRAFT,
				created_by: user.id
			})
			.select()
			.single<WeeklySchedule>();

		if (insertError) {
			console.error('Error creating schedule:', insertError);
			return {
				success: false,
				message: 'Failed to create schedule'
			};
		}

		return {
			success: true,
			message: 'Schedule created successfully',
			schedule: newSchedule
		};
	} catch (err) {
		console.error('Unexpected error during schedule creation:', err);
		return {
			success: false,
			message: 'An unexpected error occurred while creating schedule'
		};
	}
});

/**
 * Delete a schedule and all its shifts
 */
const deleteScheduleSchema = z.object({
	scheduleId: z.number().int().positive()
});

export const deleteSchedule = command(deleteScheduleSchema, async ({ scheduleId }) => {
	const supabase = createServerClient();

	try {
		// Delete schedule (shifts will be deleted via CASCADE)
		const { error: deleteError } = await supabase
			.from('weekly_schedules')
			.delete()
			.eq('id', scheduleId);

		if (deleteError) {
			console.error('Error deleting schedule:', deleteError);
			return {
				success: false,
				message: 'Failed to delete schedule'
			};
		}

		return {
			success: true,
			message: 'Schedule deleted successfully'
		};
	} catch (err) {
		console.error('Unexpected error during schedule deletion:', err);
		return {
			success: false,
			message: 'An unexpected error occurred while deleting schedule'
		};
	}
});

/**
 * Update schedule status
 */
const updateScheduleStatusSchema = z.object({
	scheduleId: z.number().int().positive(),
	status: z.enum(['draft', 'published', 'archived'])
});

export const updateScheduleStatus = command(
	updateScheduleStatusSchema,
	async ({ scheduleId, status }) => {
		const supabase = createServerClient();
		const user = await requireAuthenticatedUser();

		try {
			const updateData: any = {
				status
			};

			// If publishing, set published info
			if (status === SCHEDULE_STATUS.PUBLISHED) {
				updateData.published_by = user.id;
				updateData.published_at = new Date().toISOString();
			}

			const { error: updateError } = await supabase
				.from('weekly_schedules')
				.update(updateData)
				.eq('id', scheduleId);

			if (updateError) {
				console.error('Error updating schedule status:', updateError);
				return {
					success: false,
					message: 'Failed to update schedule status'
				};
			}

			return {
				success: true,
				message: `Schedule ${status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'set to draft'} successfully`
			};
		} catch (err) {
			console.error('Unexpected error during status update:', err);
			return {
				success: false,
				message: 'An unexpected error occurred while updating schedule status'
			};
		}
	}
);

// ======================== PAGINATION ==============

/**
 * Get schedules with pagination (no metrics)
 */
const paginationSchema = z.object({
	page: z.number().int().positive().default(1),
	perPage: z.number().int().positive().default(9)
});

export const getSchedulesWithMetricsPaginated = query(
	paginationSchema,
	async ({ page, perPage }) => {
		const supabase = createServerClient();

		try {
			// Calculate offset
			const offset = (page - 1) * perPage;

			// Get total count
			const { count, error: countError } = await supabase
				.from('weekly_schedules')
				.select('*', { count: 'exact', head: true });

			if (countError) {
				console.error('Error counting schedules:', countError);
				return {
					success: false,
					message: 'Error fetching schedules',
					schedules: [],
					totalCount: 0,
					totalPages: 0,
					currentPage: page
				};
			}

			// Get paginated schedules
			const { data: schedules, error: schedulesError } = await supabase
				.from('weekly_schedules')
				.select('*')
				.order('week_start_date', { ascending: false })
				.range(offset, offset + perPage - 1)
				.overrideTypes<WeeklySchedule[]>();

			if (schedulesError) {
				console.error('Error fetching schedules:', schedulesError);
				return {
					success: false,
					message: 'Error fetching schedules',
					schedules: [],
					totalCount: 0,
					totalPages: 0,
					currentPage: page
				};
			}

			const totalPages = Math.ceil((count ?? 0) / perPage);

			return {
				success: true,
				schedules: schedules ?? [],
				totalCount: count ?? 0,
				totalPages,
				currentPage: page
			};
		} catch (err) {
			console.error('Unexpected error fetching paginated schedules:', err);
			return {
				success: false,
				message: 'An unexpected error occurred while fetching schedules',
				schedules: [],
				totalCount: 0,
				totalPages: 0,
				currentPage: page
			};
		}
	}
);

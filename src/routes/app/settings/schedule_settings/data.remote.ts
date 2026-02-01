import { query, command } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { WeeklySchedule } from '$lib/models/schedule.types';
import { SCHEDULE_STATUS } from '$lib/models/schedule.types';
import { z } from 'zod/v4';
import { getUserOrgId, getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { sendBulkScheduleNotifications } from '$lib/emails/schedule-notifications';

// ======================== AUTH ACCESS CHECK ==============

export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([1, 2]);
	return {
		susscess: true,
		profile
	};
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

/**
 * Send email notifications to all employees in the schedule
 */
async function sendScheduleNotifications(
    supabase: any, 
    schedule: any,  
): Promise<{ sentCount: number; errors: string[] }> {
    try {
        const org_id = await getUserOrgId();


        const { data: org, error: orgError } = await supabase
            .from('core_organizations')
            .select('store_name')
            .eq('id', org_id)
            .single();

        if (orgError) {
            console.error('Error fetching organization:', orgError);
            return { sentCount: 0, errors: ['Failed to fetch organization'] };
        }

        const { data: employees, error: employeesError } = await supabase
            .from('profiles')
            .select('id, email, full_name, username')
            .eq('org_id', org_id);

        if (employeesError) {
            console.error('Error fetching employees for notifications:', employeesError);
            return { sentCount: 0, errors: ['Failed to fetch employee list'] };
        }

        if (!employees || employees.length === 0) {
            console.log('No employees found for schedule notifications');
            return { sentCount: 0, errors: [] };
        }

        console.log(`Sending schedule notifications to ${employees.length} employees...`);

        const emailParams = employees.map((employee: any) => ({
            recipientEmail: employee.email,
            employeeName: employee.full_name || employee.username,
            organizationName: org.store_name, 
            weekStartDate: schedule.week_start_date,
            weekEndDate: schedule.week_end_date,
            scheduleId: schedule.id.toString()
        }));

        const result = await sendBulkScheduleNotifications(emailParams);

        return {
            sentCount: result.sentCount,
            errors: result.errors
        };

    } catch (err) {
        console.error('Error sending schedule notifications:', err);
        return { 
            sentCount: 0, 
            errors: ['Failed to send notifications'] 
        };
    }
}

/**
 * Update schedule status
 */
export const updateScheduleStatus = command(
    updateScheduleStatusSchema,
    async ({ scheduleId, status }) => {
        const supabase = createServerClient();
        const user = await requireAuthenticatedUser();

        try {
            const updateData: any = { status };

            if (status === SCHEDULE_STATUS.PUBLISHED) {
                updateData.published_by = user.id;
                updateData.published_at = new Date().toISOString();
            }

            const { data: scheduleArray, error: updateError } = await supabase
                .from('weekly_schedules')
                .update(updateData)
                .eq('id', scheduleId)
                .select()
                .single(); 

            if (updateError) {
                console.error('Error updating schedule status:', updateError);
                return {
                    success: false,
                    message: 'Failed to update schedule status'
                };
            }


            if (status === SCHEDULE_STATUS.PUBLISHED) {
                const emailResult = await sendScheduleNotifications(supabase, scheduleArray);
                console.log(`Sent ${emailResult.sentCount} emails, ${emailResult.errors.length} failures`);
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

export interface ScheduleWithMetrics extends WeeklySchedule {
	employee_count: number;
	shift_count: number;
	morning_shifts: number;
	afternoon_shifts: number;
	evening_shifts: number;
}

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
					schedules: [] as ScheduleWithMetrics[],
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
					schedules: [] as ScheduleWithMetrics[],
					totalCount: 0,
					totalPages: 0,
					currentPage: page
				};
			}

			// Get metrics for each schedule
			const schedulesWithMetrics: ScheduleWithMetrics[] = await Promise.all(
				(schedules ?? []).map(async (schedule) => {
					const { data: shifts } = await supabase
						.from('shifts')
						.select('user_id, shift_category')
						.eq('schedule_id', schedule.id);

					const uniqueEmployees = new Set((shifts ?? []).map((s) => s.user_id));
					const morningShifts = (shifts ?? []).filter((s) => s.shift_category === 'morning').length;
					const afternoonShifts = (shifts ?? []).filter((s) => s.shift_category === 'afternoon').length;
					const eveningShifts = (shifts ?? []).filter((s) => s.shift_category === 'evening').length;

					return {
						...schedule,
						employee_count: uniqueEmployees.size,
						shift_count: shifts?.length ?? 0,
						morning_shifts: morningShifts,
						afternoon_shifts: afternoonShifts,
						evening_shifts: eveningShifts
					};
				})
			);

			const totalPages = Math.ceil((count ?? 0) / perPage);

			return {
				success: true,
				schedules: schedulesWithMetrics,
				totalCount: count ?? 0,
				totalPages,
				currentPage: page
			};
		} catch (err) {
			console.error('Unexpected error fetching paginated schedules:', err);
			return {
				success: false,
				message: 'An unexpected error occurred while fetching schedules',
				schedules: [] as ScheduleWithMetrics[],
				totalCount: 0,
				totalPages: 0,
				currentPage: page
			};
		}
	}
);

// ======================== COPY SCHEDULE ==============

const copyScheduleSchema = z.object({
	sourceScheduleId: z.number().int().positive(),
	targetWeekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

export const copySchedule = command(copyScheduleSchema, async ({ sourceScheduleId, targetWeekStart }) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		// Get source schedule
		const { data: sourceSchedule, error: sourceError } = await supabase
			.from('weekly_schedules')
			.select('*')
			.eq('id', sourceScheduleId)
			.single<WeeklySchedule>();

		if (sourceError || !sourceSchedule) {
			return { success: false, message: 'Source schedule not found' };
		}

		// Calculate target end date
		const startDate = new Date(targetWeekStart);
		const endDate = new Date(startDate);
		endDate.setDate(startDate.getDate() + 6);

		// Create new schedule
		const { data: newSchedule, error: createError } = await supabase
			.from('weekly_schedules')
			.insert({
				org_id: sourceSchedule.org_id,
				week_start_date: targetWeekStart,
				week_end_date: endDate.toISOString().split('T')[0],
				year: startDate.getFullYear(),
				status: SCHEDULE_STATUS.DRAFT,
				created_by: user.id
			})
			.select()
			.single<WeeklySchedule>();

		if (createError || !newSchedule) {
			console.error('Error creating new schedule:', createError);
			return { success: false, message: 'Failed to create new schedule' };
		}

		// Get source shifts
		const { data: sourceShifts, error: shiftsError } = await supabase
			.from('shifts')
			.select('*')
			.eq('schedule_id', sourceScheduleId);

		if (shiftsError) {
			console.error('Error fetching source shifts:', shiftsError);
			return { success: false, message: 'Failed to copy shifts' };
		}

		// Copy shifts with adjusted dates
		if (sourceShifts && sourceShifts.length > 0) {
			const sourceStart = new Date(sourceSchedule.week_start_date);

			const newShifts = sourceShifts.map((shift) => {
				const shiftDate = new Date(shift.shift_date);
				const dayOffset = Math.floor((shiftDate.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24));
				const newShiftDate = new Date(startDate);
				newShiftDate.setDate(startDate.getDate() + dayOffset);

				return {
					org_id: shift.org_id,
					schedule_id: newSchedule.id,
					user_id: shift.user_id,
					shift_date: newShiftDate.toISOString().split('T')[0],
					start_time: shift.start_time,
					end_time: shift.end_time,
					shift_type: shift.shift_type,
					shift_category: shift.shift_category,
					break_duration_minutes: shift.break_duration_minutes,
					notes: shift.notes,
					created_by: user.id
				};
			});

			const { error: insertError } = await supabase.from('shifts').insert(newShifts);

			if (insertError) {
				console.error('Error copying shifts:', insertError);
				// Still return success as the schedule was created
				return {
					success: true,
					message: 'Schedule created but some shifts could not be copied',
					schedule: newSchedule
				};
			}
		}

		return {
			success: true,
			message: `Το πρόγραμμα αντιγράφηκε επιτυχώς με ${sourceShifts?.length ?? 0} βάρδιες`,
			schedule: newSchedule
		};
	} catch (err) {
		console.error('Unexpected error copying schedule:', err);
		return { success: false, message: 'An unexpected error occurred' };
	}
});

// ======================== CALENDAR OVERVIEW ==============

const calendarOverviewSchema = z.object({
	year: z.number().int().min(2024).max(2100)
});

export const getScheduleCalendarOverview = query(calendarOverviewSchema, async ({ year }) => {
	const supabase = createServerClient();

	try {
		const { data: schedules, error } = await supabase
			.from('weekly_schedules')
			.select('*')
			.eq('year', year)
			.order('week_start_date', { ascending: true });

		if (error) {
			console.error('Error fetching calendar overview:', error);
			return { success: false, schedules: [] };
		}

		return {
			success: true,
			schedules: schedules ?? []
		};
	} catch (err) {
		console.error('Unexpected error fetching calendar overview:', err);
		return { success: false, schedules: [] };
	}
});

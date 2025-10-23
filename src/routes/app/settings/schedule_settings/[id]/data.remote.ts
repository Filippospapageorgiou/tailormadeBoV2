import { query, command, form, prerender } from "$app/server";
import { createServerClient, createAdminClient  } from "$lib/supabase/server";
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Profile } from "$lib/models/database.types";
import type { WeeklySchedule, Shift, ShiftChangeRequest, ShiftChangeRequestPorfile} from "$lib/models/schedule.types";
import { SCHEDULE_STATUS, SHIFT_TYPE, SHIFT_CATEGORY } from "$lib/models/schedule.types";
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

// ======================== AUTH ACCESS CHECK ==============

export const authenticatedAccess = query(async () => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();

    const {data , error:profileError} = await supabase
      .from('profiles')
      .select('*')
      .eq('id',user.id)
      .overrideTypes<Profile[]>();

    if(profileError){
      console.error('Error fetching profile info in load time:', profileError);
      error(404,'Not found user info');
    }

    let profile:Profile;

    if(data && data.length > 0)  profile = data[0];
    else error(404,'Not found user info');

    if(profile.role_id !== 1 && profile.role_id !== 2){
      throw redirect(308,'/app')
    }
    return { profile };
})

// ======================== QUERIES ==============

/**
 * Get all employees from the organization for schedule assignment
 */
export const getEmployees = query(async () => {
    const supabase = createServerClient();
    const user =  await requireAuthenticatedUser();

    // get orgId from admin user
    const { data:orgId , error:orgIdError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();
    if(orgIdError){
        console.error('Error fecthing users orgId: ',orgIdError);
        return {
            success: false,
            message: 'Error fetching employees',
            employees: []
        };
    }

    const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('*')
        .order('username')
        .eq('org_id',orgId.org_id)
        .overrideTypes<Profile[]>();

    if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        return {
            success: false,
            message: 'Error fetching employees',
            employees: []
        };
    }

    return {
        success: true,
        employees: employees ?? []
    };
});



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

/**
 * Get a specific schedule by ID with all its shifts
 */
const scheduleIdSchema = z.object({
    scheduleId:z.number()
                .int({ message: 'Schedule ID must be an integer.' })
                .positive({ message: 'Schedule ID must be a positive number.' })
        
});

export const getScheduleById = query(scheduleIdSchema, async ({ scheduleId }) => {
    const supabase = createServerClient();

    // Get schedule
    const { data: schedule, error: scheduleError } = await supabase
        .from('weekly_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single<WeeklySchedule>()

    if (scheduleError) {
        console.error('Error fetching schedule:', scheduleError);
        return {
            success: false,
            message: 'Error fetching schedule',
            schedule: null,
            shifts: []
        };
    }

    // Get all shifts for this schedule
    const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('schedule_id', scheduleId)
        .order('shift_date')
        .overrideTypes<Shift[]>();

    if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
        return {
            success: false,
            message: 'Error fetching shifts',
            schedule: schedule,
            shifts: []
        };
    }

    return {
        success: true,
        schedule: schedule,
        shifts: shifts ?? []
    };
});

/**
 * Get shifts for a specific employee in a schedule
 */
const employeeScheduleSchema = z.object({
    scheduleId: z.number().int().positive(),
    userId: z.uuid()
});

export const getEmployeeShifts = query(employeeScheduleSchema, async ({ scheduleId, userId }) => {
    const supabase = createServerClient();

    const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('schedule_id', scheduleId)
        .eq('user_id', userId)
        .order('shift_date')
        .overrideTypes<Shift[]>();

    if (shiftsError) {
        console.error('Error fetching employee shifts:', shiftsError);
        return {
            success: false,
            message: 'Error fetching employee shifts',
            shifts: []
        };
    }

    return {
        success: true,
        shifts: shifts ?? []
    };
});

// ======================== COMMANDS ==============


/**
 * Add a shift to a schedule
 */
const addShiftSchema = z.object({
    schedule_id: z.number().int().positive(),
    user_id: z.uuid(),
    org_id: z.number().int().positive(),
    shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:MM:SS format').nullable(),
    end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:MM:SS format').nullable(),
    shift_type: z.enum(['work', 'day_off', 'sick_leave', 'vacation']),
    shift_category: z.enum(['morning', 'afternoon', 'evening', 'night']).nullable(),
    break_duration_minutes: z.number().int().min(0).default(0),
    notes: z.string().nullable().optional()
});

export const addShift = command(addShiftSchema, async (shiftData) => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();

    try {
        const { error: insertError } = await supabase
            .from('shifts')
            .insert({
                schedule_id: shiftData.schedule_id,
                user_id: shiftData.user_id,
                org_id:shiftData.org_id,
                shift_date: shiftData.shift_date,
                start_time: shiftData.start_time,
                end_time: shiftData.end_time,
                shift_type: shiftData.shift_type,
                shift_category: shiftData.shift_category,
                break_duration_minutes: shiftData.break_duration_minutes,
                notes: shiftData.notes ?? null,
                created_by: user.id
            });

        if (insertError) {
            console.error('Error adding shift:', insertError);
            return {
                success: false,
                message: 'Failed to add shift'
            };
        }

        return {
            success: true,
            message: 'Shift added successfully'
        };
    } catch (err) {
        console.error('Unexpected error during shift addition:', err);
        return {
            success: false,
            message: 'An unexpected error occurred while adding shift'
        };
    }
});

/**
 * Update an existing shift
 */
const updateShiftSchema = z.object({
    id: z.number().int().positive(),
    shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:MM:SS format').nullable(),
    end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:MM:SS format').nullable(),
    shift_type: z.enum(['work', 'day_off', 'sick_leave', 'vacation']),
    shift_category: z.enum(['morning', 'afternoon', 'evening', 'night']).nullable(),
    break_duration_minutes: z.number().int().min(0),
    notes: z.string().nullable().optional()
});

export const updateShift = command(updateShiftSchema, async (shiftData) => {
    const supabase = createServerClient();

    try {
        const { error: updateError } = await supabase
            .from('shifts')
            .update({
                shift_date: shiftData.shift_date,
                start_time: shiftData.start_time,
                end_time: shiftData.end_time,
                shift_type: shiftData.shift_type,
                shift_category: shiftData.shift_category,
                break_duration_minutes: shiftData.break_duration_minutes,
                notes: shiftData.notes ?? null
            })
            .eq('id', shiftData.id);

        if (updateError) {
            console.error('Error updating shift:', updateError);
            return {
                success: false,
                message: 'Failed to update shift'
            };
        }

        return {
            success: true,
            message: 'Shift updated successfully'
        };
    } catch (err) {
        console.error('Unexpected error during shift update:', err);
        return {
            success: false,
            message: 'An unexpected error occurred while updating shift'
        };
    }
});

/**
 * Delete a shift
 */
const deleteShiftSchema = z.object({
    shiftId: z.number().int().positive()
});

export const deleteShift = command(deleteShiftSchema, async ({ shiftId }) => {
    const supabase = createServerClient();

    try {
        const { error: deleteError } = await supabase
            .from('shifts')
            .delete()
            .eq('id', shiftId);

        if (deleteError) {
            console.error('Error deleting shift:', deleteError);
            return {
                success: false,
                message: 'Failed to delete shift'
            };
        }

        return {
            success: true,
            message: 'Shift deleted successfully'
        };
    } catch (err) {
        console.error('Unexpected error during shift deletion:', err);
        return {
            success: false,
            message: 'An unexpected error occurred while deleting shift'
        };
    }
});

/**
 * Publish a schedule (makes it visible to employees)
 */
const publishScheduleSchema = z.object({
    scheduleId: z.number().int().positive()
});

export const publishSchedule = command(publishScheduleSchema, async ({ scheduleId }) => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();

    try {
        const { error: updateError } = await supabase
            .from('weekly_schedules')
            .update({
                status: SCHEDULE_STATUS.PUBLISHED,
                published_by: user.id,
                published_at: new Date().toISOString()
            })
            .eq('id', scheduleId);

        if (updateError) {
            console.error('Error publishing schedule:', updateError);
            return {
                success: false,
                message: 'Failed to publish schedule'
            };
        }

        return {
            success: true,
            message: 'Schedule published successfully'
        };
    } catch (err) {
        console.error('Unexpected error during schedule publication:', err);
        return {
            success: false,
            message: 'An unexpected error occurred while publishing schedule'
        };
    }
});

/**
 * Archive a schedule
 */
const archiveScheduleSchema = z.object({
    scheduleId: z.number().int().positive()
});

export const archiveSchedule = command(archiveScheduleSchema, async ({ scheduleId }) => {
    const supabase = createServerClient();

    try {
        const { error: updateError } = await supabase
            .from('weekly_schedules')
            .update({
                status: SCHEDULE_STATUS.ARCHIVED
            })
            .eq('id', scheduleId);

        if (updateError) {
            console.error('Error archiving schedule:', updateError);
            return {
                success: false,
                message: 'Failed to archive schedule'
            };
        }

        return {
            success: true,
            message: 'Schedule archived successfully'
        };
    } catch (err) {
        console.error('Unexpected error during schedule archiving:', err);
        return {
            success: false,
            message: 'An unexpected error occurred while archiving schedule'
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
 * Validate schedule before publishing
 * Returns validation errors if any
 */
export const validateSchedule = query(scheduleIdSchema, async ({ scheduleId }) => {
    const supabase = createServerClient();

    try {
        // Get all shifts for this schedule
        const { data: shifts, error: shiftsError } = await supabase
            .from('shifts')
            .select('*')
            .eq('schedule_id', scheduleId)
            .overrideTypes<Shift[]>();

        if (shiftsError) {
            console.error('Error fetching shifts for validation:', shiftsError);
            return {
                success: false,
                message: 'Error validating schedule',
                valid: false,
                errors: ['Failed to fetch shifts']
            };
        }

        const validationErrors: string[] = [];

        // Check if schedule has any shifts
        if (!shifts || shifts.length === 0) {
            validationErrors.push('Schedule has no shifts assigned');
        }

        // Validate each shift
        shifts?.forEach((shift, index) => {
            // If shift is work type, must have start and end time
            if (shift.shift_type === SHIFT_TYPE.WORK) {
                if (!shift.start_time) {
                    validationErrors.push(`Shift ${index + 1}: Work shift must have a start time`);
                }
                if (!shift.end_time) {
                    validationErrors.push(`Shift ${index + 1}: Work shift must have an end time`);
                }
                // Validate that end time is after start time
                if (shift.start_time && shift.end_time && shift.start_time >= shift.end_time) {
                    validationErrors.push(`Shift ${index + 1}: End time must be after start time`);
                }
            }
        });

        return {
            success: true,
            valid: validationErrors.length === 0,
            errors: validationErrors
        };
    } catch (err) {
        console.error('Unexpected error during schedule validation:', err);
        return {
            success: false,
            message: 'An unexpected error occurred during validation',
            valid: false,
            errors: ['Validation failed']
        };
    }
});

/**
 * Calculate total hours for a user in a schedule
 */
const calculateHoursSchema = z.object({
    scheduleId: z.number().int().positive(),
    userId: z.uuid()
});

export const calculateUserHours = query(calculateHoursSchema, async ({ scheduleId, userId }) => {
    const supabase = createServerClient();

    try {
        const { data: shifts, error: shiftsError } = await supabase
            .from('shifts')
            .select('*')
            .eq('schedule_id', scheduleId)
            .eq('user_id', userId)
            .eq('shift_type', SHIFT_TYPE.WORK)
            .overrideTypes<Shift[]>();

        if (shiftsError) {
            console.error('Error fetching shifts for hour calculation:', shiftsError);
            return {
                success: false,
                message: 'Error calculating hours',
                totalHours: 0
            };
        }

        let totalMinutes = 0;

        shifts?.forEach((shift) => {
            if (shift.start_time && shift.end_time) {
                // Parse time strings (HH:MM:SS)
                const [startHour, startMin] = shift.start_time.split(':').map(Number);
                const [endHour, endMin] = shift.end_time.split(':').map(Number);

                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;

                const shiftMinutes = endMinutes - startMinutes;
                const netMinutes = shiftMinutes - (shift.break_duration_minutes || 0);

                totalMinutes += netMinutes;
            }
        });

        const totalHours = totalMinutes / 60;

        return {
            success: true,
            totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimals
            totalShifts: shifts?.length ?? 0
        };
    } catch (err) {
        console.error('Unexpected error during hour calculation:', err);
        return {
            success: false,
            message: 'An unexpected error occurred during hour calculation',
            totalHours: 0
        };
    }
});


const shiftChangesSchemaId = z.object({
    scheduleId : z.number().positive().int()
})

export const getShiftChanges = query(shiftChangesSchemaId, async( scheduleId ) => {
    const supabase = createServerClient();

    const { data:shifts, error:shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('schedule_id',scheduleId.scheduleId)
        .overrideTypes<Shift[]>();
    
    if(shiftsError){
        console.error(`Error fetching shifts from schedule ${scheduleId} error: `,shiftsError);
        return {
            success:false,
            message:'An error occured trying to fetch shifts',
            shiftRequests: []
        };
    }

    let shiftChangesArray:ShiftChangeRequestPorfile[] = []
    let shift:Shift
    for(shift of shifts){
        const { data: shiftRequest, error } = await supabase
            .from('shift_change_requests')
            .select(`
                    *,
                    shift:shift_id(*),
                    profile:requested_by (*)
                `)
            .eq('shift_id', shift.id)
            .eq('status', 'pending')
            .maybeSingle<ShiftChangeRequestPorfile>();
        
        if(error){
            console.error(`Error fetching shifts changes  error: `, error);
            return {
                success:false,
                message:'An error occured trying to fetch shifts',
                shiftRequests: []
            };
        }

        if(shiftRequest) shiftChangesArray.push(shiftRequest);
    }

    return {
        success: true,
        message:'Sucess fetching shift requests',
        shiftRequests: shiftChangesArray
    }

})  

const shiftRequestId = z.object({
    shiftChangeId : z.number().positive().int()
})

export const approveShiftRequest = command(shiftRequestId, async(shiftChangeId) => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();

    const { data, error } = await supabase
        .from('shift_change_requests')
        .update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
            })
        .eq('id', shiftChangeId.shiftChangeId)
        .select()
        .single();

    if(error){
        console.error('Error approving shift request: ',error);
        return {
            success: false,
            message:'An unexpected error occured'
        };
    }

    return {
        success:true,
        message:'Successfuly approved shift request'
    };
});

const shiftRequestReject = z.object({
    shiftChangeId : z.number().positive().int(),
    adminText:z.string()
})

export const rejectShift = command(shiftRequestReject, async(dataRequest) => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();

    const { data, error } = await supabase
        .from('shift_change_requests')
        .update({
            status: 'rejected',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            admin_notes:dataRequest.adminText
            })
        .eq('id', dataRequest.shiftChangeId)
        .select()
        .single();

    if(error){
        console.error('Error approving shift request: ',error);
        return {
            success: false,
            message:'An unexpected error occured'
        };
    }

    return {
        success:true,
        message:'Successfuly rejected shift request'
    };
});
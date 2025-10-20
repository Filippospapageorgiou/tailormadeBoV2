import { query, form } from "$app/server";
import { createServerClient } from "$lib/supabase/server";
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Profile, Organization } from "$lib/models/database.types";
import type { WeeklySchedule, Shift } from "$lib/models/schedule.types";
import { SCHEDULE_STATUS, SHIFT_TYPE } from "$lib/models/schedule.types";
import z from "zod/v4";

// ======================== QUERIES ==============

/**
 * Get the most recent published schedule with all employees and shifts
 */
export const getCurrentSchedule = query(async () => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();

    try {
        // Get user's org_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single<Pick<Profile, 'org_id'>>();

        if (profileError || !profile) {
            console.error('Error fetching user profile:', profileError);
            return {
                success: false,
                message: 'Error fetching user profile',
                schedule: null,
                employees: [],
                shifts: [],
                totalHours: 0,
                averageHours: 0
            };
        }

        // Get the most recent published schedule for this organization
        const { data: schedule, error: scheduleError } = await supabase
            .from('weekly_schedules')
            .select('*')
            .eq('org_id', profile.org_id)
            .eq('status', SCHEDULE_STATUS.PUBLISHED)
            .order('week_start_date', { ascending: false })
            .limit(1)
            .maybeSingle<WeeklySchedule>();

        if (scheduleError || !schedule) {
            console.error('Error fetching schedule:', scheduleError);
            return {
                success: false,
                message: 'No published schedule found',
                schedule: null,
                employees: [],
                shifts: [],
                totalHours: 0,
                averageHours: 0
            };
        }

        // Get all employees in this organization
        const { data: employees, error: employeesError } = await supabase
            .from('profiles')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('username')
            .overrideTypes<Profile[]>();

        if (employeesError) {
            console.error('Error fetching employees:', employeesError);
            return {
                success: false,
                message: 'Error fetching employees',
                schedule: schedule,
                employees: [],
                shifts: [],
                totalHours: 0,
                averageHours: 0
            };
        }

        // Get all shifts for this schedule
        const { data: shifts, error: shiftsError } = await supabase
            .from('shifts')
            .select('*')
            .eq('schedule_id', schedule.id)
            .order('shift_date')
            .overrideTypes<Shift[]>();
        

        if (shiftsError) {
            console.error('Error fetching shifts:', shiftsError);
            return {
                success: false,
                message: 'Error fetching shifts',
                schedule: schedule,
                employees: employees ?? [],
                shifts: [],
                totalHours: 0,
                averageHours: 0
            };
        }

        // Calculate total hours and average
        let totalMinutes = 0;
        const employeeHours = new Map<string, number>();

        shifts?.forEach((shift) => {
            if (shift.shift_type === SHIFT_TYPE.WORK && shift.start_time && shift.end_time) {
                const [startHour, startMin] = shift.start_time.split(':').map(Number);
                const [endHour, endMin] = shift.end_time.split(':').map(Number);

                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;

                const shiftMinutes = endMinutes - startMinutes;
                const netMinutes = shiftMinutes - (shift.break_duration_minutes || 0);

                totalMinutes += netMinutes;

                // Track per employee
                const currentHours = employeeHours.get(shift.user_id) || 0;
                employeeHours.set(shift.user_id, currentHours + netMinutes / 60);
            }
        });

        const totalHours = Math.round(totalMinutes / 60);
        const averageHours = employees && employees.length > 0 
            ? Math.round(totalHours / employees.length) 
            : 0;

        return {
            success: true,
            schedule: schedule,
            employees: employees ?? [],
            shifts: shifts ?? [],
            employeeHours: Object.fromEntries(employeeHours), // Convert Map to object for serialization
            totalHours,
            averageHours
        };
    } catch (err) {
        console.error('Unexpected error fetching schedule:', err);
        return {
            success: false,
            message: 'An unexpected error occurred',
            schedule: null,
            employees: [],
            shifts: [],
            totalHours: 0,
            averageHours: 0
        };
    }
});

const shiftIdSchema = z.object({
    id: z.number().int().positive()
});

export const getShfitInfo = query(shiftIdSchema, async ({ id }) => {
    const supabase = createServerClient();

    try {
        const { data: shift, error } = await supabase
            .from('shifts')
            .select(`
                *,
                profiles!shifts_user_id_fkey (*)
            `)
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching shift:', error);
            return {
                success: false,
                message: 'Error fetching shift',
                shift: null,
            };
        }
        return {
            success: true,
            message: 'Shift fetched successfully',
            shift: shift,
        };

    } catch (error) {
        console.error('Error fetching shift details: ', error);
        return {
            success: false,
            message: 'Error fetching shift details',
            shift: null,
        };
    }
});

const shiftChangeRequestSchema = z.object({
    shift_id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
    request_type:z.enum(['change','swap','cancel']),
    swap_with_user_id: z.uuid().optional(),
    swap_with_shift_id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
    proposed_date:z.string().optional(),
    proposed_start_time:z.string().optional(),
    proposed_end_time:z.string().optional(),
    reason: z.string()
        .min(10, { error: 'Η αιτιολογία πρέπει να είναι τουλάχιστον 10 χαρακτήρες' })
        .max(500, { error: 'Η αιτιολογία δεν μπορεί να υπερβαίνει τους 500 χαρακτήρες' })
})

export const createShiftChangeRequest = form(shiftChangeRequestSchema, async (data) => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();

    try {
        // Get user's org_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single<Pick<Profile, 'org_id'>>();

        if (profileError || !profile) {
            return {
                success: false,
                message: 'Error fetching user profile'
            };
        }

        // Verify the shift belongs to the user
        const { data: shift, error: shiftError } = await supabase
            .from('shifts')
            .select('user_id, org_id')
            .eq('id', data.shift_id)
            .single();

        if (shiftError || !shift) {
            return {
                success: false,
                message: 'Shift not found'
            };
        }

        if (shift.user_id !== user.id) {
            return {
                success: false,
                message: 'You can only request changes to your own shifts'
            };
        }

        if (shift.org_id !== profile.org_id) {
            return {
                success: false,
                message: 'Invalid organization'
            };
        }

        // Check if there's already a pending request for this shift
        const { data: existingRequest, error: existingError } = await supabase
            .from('shift_change_requests')
            .select('id, status')
            .eq('shift_id', data.shift_id)
            .eq('status', 'pending')
            .maybeSingle();

        if (existingError && existingError.code !== 'PGRST116') {
            console.error('Error checking existing requests:', existingError);
            return {
                success: false,
                message: 'Error checking existing requests'
            };
        }

        if (existingRequest) {
            return {
                success: false,
                message: 'There is already a pending request for this shift'
            };
        }

        // Create the shift change request
        const { data: newRequest, error: insertError } = await supabase
            .from('shift_change_requests')
            .insert({
                org_id: profile.org_id,
                shift_id: data.shift_id,
                requested_by: user.id,
                request_type: data.request_type,
                swap_with_user_id: data.swap_with_user_id || null,
                swap_with_shift_id: data.swap_with_shift_id || null,
                proposed_date: data.proposed_date || null,
                proposed_start_time: data.proposed_start_time || null,
                proposed_end_time: data.proposed_end_time || null,
                reason: data.reason,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating shift change request:', insertError);
            return {
                success: false,
                message: 'Failed to create shift change request'
            };
        }

        return {
            success: true,
            message: 'Shift change request created successfully',
            request: newRequest
        };
    } catch (err) {
        console.error('Unexpected error creating shift change request:', err);
        return {
            success: false,
            message: 'An unexpected error occurred'
        };
    }
});
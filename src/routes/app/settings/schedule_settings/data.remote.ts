import { query, command, form, prerender } from "$app/server";
import { createServerClient, createAdminClient  } from "$lib/supabase/server";
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Profile } from "$lib/models/database.types";
import type { WeeklySchedule } from "$lib/models/schedule.types";
import { SCHEDULE_STATUS } from "$lib/models/schedule.types";
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
    const { data:profile , error:profileError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();
    if(profileError){
        console.error('Error fecthing profile info: ',profileError);
        return {
            success: false,
            message: 'Failed to create schedule'
        };
    }

    try {
        const { data: newSchedule, error: insertError } = await supabase
            .from('weekly_schedules')
            .insert({
                org_id:profile.org_id,
                week_start_date: scheduleData.week_start_date,
                week_end_date: scheduleData.week_end_date,
                year: scheduleData.year,
                status: SCHEDULE_STATUS.DRAFT,
                created_by: user.id,
            })
            .select()
            .single<WeeklySchedule>()

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

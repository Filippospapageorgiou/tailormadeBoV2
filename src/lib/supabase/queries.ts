import { createServerClient } from "./server";
import { requireAuthenticatedUser } from "./shared";
import type { Profile } from "$lib/models/database.types";
import { error } from "@sveltejs/kit";


/**
 * Get the current authenticated userd org_id
 * @returns Promise with org_id throws error if not found
 */

export async function getUserOrgId():Promise<number> {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();
    try{
        const { data:profile, error:profileError } = await supabase 
            .from('profiles')
            .select('org_id')
            .eq('id',user.id)
            .single<Pick<Profile, 'org_id'>>();

        if (profileError || !profile) {
            console.error('[getUserOrgId] Error fetching user org_id:', profileError);
            throw error(404, 'Organization not found for user');
        }

        return profile.org_id;
    } catch (err) {
        console.error('[getUserOrgId] Error fetching user org_id:', err);
        throw error(404, 'Organization not found for user');
    }
}

/**
 * Get the current authenticated user's full profile
 * 
 * @returns Promise with full Profile object
 */
export async function getUserProfile(): Promise<Profile> {
  const supabase = createServerClient();
  const user = await requireAuthenticatedUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  if (profileError || !profile) {
    console.error('[getUserProfile] Error fetching user profile:', profileError);
    throw error(404, 'User profile not found');
  }

  return profile;
}

/**
 * Get user profile with role validation
 * Ensures user has required role_id (1 = admin, 2 = manager, etc.)
 * 
 * @param allowedRoles - Array of role_ids that are permitted
 * @returns Promise with Profile object if validation passes
 */
export async function getUserProfileWithRoleCheck(allowedRoles: number[]): Promise<Profile> {
  const profile = await getUserProfile();

  if (!allowedRoles.includes(profile.role_id)) {
    console.error('[getUserProfileWithRoleCheck] User role not authorized:', {
      userId: profile.id,
      userRole: profile.role_id,
      allowedRoles
    });
    throw error(403, 'Insufficient permissions');
  }

  return profile;
}

/**
 * Format a Date object to YYYY-MM-DD string (local time)
 * 
 * @param date - Date object to format
 * @returns Formatted date string
 */
export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Calculate date ranges for current and previous periods
 * 
 * @param days - Number of days to look back
 * @returns Object with current and previous period date ranges
 */
export function getDateRanges(days: number) {
  const today = new Date();
  const currentEndDate = formatLocalDate(today);

  const currentStartDate = new Date(today);
  currentStartDate.setDate(today.getDate() - days);
  const currentStart = formatLocalDate(currentStartDate);

  // Previous period range
  const previousEndDate = new Date(currentStartDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousEnd = formatLocalDate(previousEndDate);

  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - days + 1);
  const previousStart = formatLocalDate(previousStartDate);

  return {
    currentStart,
    currentEnd: currentEndDate,
    previousStart,
    previousEnd,
  };
}
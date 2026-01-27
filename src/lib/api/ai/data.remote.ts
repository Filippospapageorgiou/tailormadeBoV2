import { query } from '$app/server';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';


// Auth check - only super_admin can access
export const authenticatedAccess = query(async () => {
    const profile = await getUserProfileWithRoleCheck([1]);
    return {
        profile,
        success: true
    };
});



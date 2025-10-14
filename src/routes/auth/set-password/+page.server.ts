import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();

    // No session = they haven't clicked the invite link yet
    if (!session) {
        return {
            email: null,
            needsAuth: true
        };
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

    if (existingProfile) {
        // Already set up - send them to login
        redirect(303, '/auth/login');
    }

    // Has session but no profile - can proceed to set password
    return {
        email: session.user.email,
        needsAuth: false
    };
};
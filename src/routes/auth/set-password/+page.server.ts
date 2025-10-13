import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    // Get the current session
    const { session } = await safeGetSession();

    
    if(session){
        const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

        if (existingProfile) {
            // User already set up their account
            redirect(303, '/auth/login?message=Your account is already set up. Please login.');
        }

        // User can proceed to set their password
        return {
            email: session.user.email,
            needsAuth: false
        };
    }
};

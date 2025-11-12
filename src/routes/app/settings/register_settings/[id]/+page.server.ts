// src/routes/app/profile/[id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import type { Profile, Organization } from '$lib/models/database.types';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {

    const profile = await getUserProfileWithRoleCheck([1, 2]);
    const { id } = params;
    
    

    return { 
        id,
        profile
    };
};


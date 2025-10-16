import type { LayoutServerLoad } from './$types';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { createServerClient } from '$lib/supabase/server';
import type { Profile, RoleTypes } from '$lib/models/database.types';
import { RlsSvcPort } from '$env/static/private';

export const load: LayoutServerLoad = async () => {
    const user = await requireAuthenticatedUser();
    const supabase = createServerClient();

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single<Profile>();
    

    if(profileError){
        console.error('Error fetching user profile: ', profileError);
        return { prfile:null }
    }
    const { data: roleType, } = await supabase
        .from('role_types')
        .select('*')
        .eq('id', profile.role_id)
        .single<RoleTypes>();
    
    profile.role_name = roleType?.role_name || '';
	return {
		profile
	};
};
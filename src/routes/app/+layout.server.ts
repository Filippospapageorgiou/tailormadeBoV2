import type { LayoutServerLoad } from './$types';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { createServerClient } from '$lib/supabase/server';
import type { Profile } from '$lib/models/database.types';

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

	return {
		profile
	};
};
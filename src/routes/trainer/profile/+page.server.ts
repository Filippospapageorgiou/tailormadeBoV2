import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { Profile } from '$lib/models/database.types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	const user_id = session?.user.id;

	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user_id)
		.single<Profile>();

	if (profileError) {
		throw error(404, 'Profile not found');
	}

	return { profile };
};

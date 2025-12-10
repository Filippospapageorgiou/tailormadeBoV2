// src/routes/app/profile/[id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import type { Profile, Organization } from '$lib/models/database.types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { id } = params;

	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select(`*`)
		.eq('id', id)
		.single<Profile>();

	if (profileError) {
		console.error('Error fetching user profile: ', profileError);
		throw error(404, 'User not found');
	}

	const { data: organization, error: organizationError } = await supabase
		.from('core_organizations')
		.select('*')
		.eq('id', profile.org_id)
		.single<Organization>();

	if (organizationError) {
		console.error('Error fetching organization info: ', organizationError);
		throw error(404, 'Organization not found');
	}

	const { data: managers, error: managersError } = await supabase
		.from('profiles')
		.select('*')
		.eq('org_id', organization.id)
		.eq('is_manager', true)
		.overrideTypes<Profile[]>();

	if (managersError) {
		console.error('Error fetching managers info: ', managersError);
		throw error(404, 'Organization not found');
	}

	return {
		organization,
		profile,
		managers: managers ?? []
	};
};

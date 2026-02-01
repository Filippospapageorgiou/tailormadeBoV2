import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { session }, parent }) => {
	const { profile } = await parent();
	
	if (!session) {
		throw redirect(303, '/auth/login');
	}
	
	// Only non-admins get redirected to app
	if (profile?.role_id !== 1) {
		throw redirect(303, '/app/');
	}
	
	// Admins stay here - just return the profile
	return {
		profile
	};
};
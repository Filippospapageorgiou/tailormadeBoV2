import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { session }, parent }) => {
    const { profile } = await parent();
	if (profile?.role_id !== 3) {
		throw redirect(303, '/app/');
	}
    if (!session) {
        throw redirect(303, '/auth/login');
    }
};
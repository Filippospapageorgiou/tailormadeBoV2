import { getProfileByUUId } from '$lib/supabase/queries';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({
	locals: { safeGetSession },
	cookies,
	url
}) => {
	const { session } = await safeGetSession();
	
	let profile = null;
	if (session?.user?.id) {
		profile = await getProfileByUUId(session.user.id);
	}

	// 1️⃣ Root redirect
	if (url.pathname === '/') {
		if (!session) {
			throw redirect(303, '/auth/login');
		} else {
			throw redirect(303, '/app/');
		}
	}

	// 2️⃣ Protected routes - require session
	if (!session && (url.pathname.startsWith('/app'))) {
		throw redirect(303, '/auth/login');
	}

	// 3️⃣ Management routes - require roleId === 1
	if (session && url.pathname.startsWith('/app/managment') && profile?.role_id !== 1) {
		throw redirect(303, '/app/');
	}

	// 4 Logged-in users shouldn't access auth pages
	if (session && url.pathname.startsWith('/auth') && url.pathname !== '/auth/set-password') {
		throw redirect(303, '/app/');
	}

	return {
		session,
		profile,
		cookies: cookies.getAll()
	};
};
import { getProfileByUUId } from '$lib/supabase/queries';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

const TRAINER_ROLE_ID = 3;

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

	const isTrainer = profile?.role_id === TRAINER_ROLE_ID;

	// 1️⃣ Root redirect — trainers go to /trainer, everyone else to /app
	if (url.pathname === '/') {
		if (!session) {
			throw redirect(303, '/auth/login');
		} else {
			throw redirect(303, isTrainer ? '/trainer' : '/app/');
		}
	}

	// 2️⃣ Protected routes — require session
	if (!session && (url.pathname.startsWith('/app') || url.pathname.startsWith('/trainer'))) {
		throw redirect(303, '/auth/login');
	}

	// 3️⃣ Trainer route — only trainers allowed; others bounce to /app
	if (session && url.pathname.startsWith('/trainer') && !isTrainer) {
		throw redirect(303, '/app/');
	}

	// 4️⃣ App route — trainers don't belong here; bounce them to /trainer
	if (session && url.pathname.startsWith('/app') && isTrainer) {
		throw redirect(303, '/trainer');
	}

	// 5️⃣ Management routes — require role_id === 1
	if (session && url.pathname.startsWith('/app/managment') && profile?.role_id !== 1) {
		throw redirect(303, '/app/');
	}

	// 6️⃣ Logged-in users shouldn't access auth pages
	if (session && url.pathname.startsWith('/auth') && url.pathname !== '/auth/set-password') {
		throw redirect(303, isTrainer ? '/trainer' : '/app/');
	}

	return {
		session,
		profile,
		cookies: cookies.getAll()
	};
};
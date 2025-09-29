import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, cookies, url }) => {
  const { session } = await safeGetSession()

	if (url.pathname === '/') {
		if (session) {
			throw redirect(303, '/app');
		}
		throw redirect(303, '/auth/login');
	}

	if (!session && url.pathname.startsWith('/app')) {
		throw redirect(303, '/auth/login');
	}

	if (session && url.pathname.startsWith('/auth')) {
		throw redirect(303, '/app');
	}
  return {
    session,
    cookies: cookies.getAll(),
  }
}
import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies, url }) => {
  const { session } = await safeGetSession()

  // Αν δεν είναι στο /auth και δεν έχει session, κάνε redirect
  if (!session && !url.pathname.startsWith('/auth')) {
    throw redirect(303, '/auth/login')
  }

  return {
    session,
    cookies: cookies.getAll(),
  }
}
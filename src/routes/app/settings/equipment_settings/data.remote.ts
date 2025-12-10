import { query, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { getAuthenticatedUser, requireAuthenticatedUser } from '$lib/supabase/shared';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getUserOrgId, getUserProfileWithRoleCheck } from '$lib/supabase/queries';

export const authenticatedAccess = query(async () => {
	const supabase = createServerClient();
	const orgId = await getUserOrgId();
	const profile = await getUserProfileWithRoleCheck([1, 2]);

	return {
		success: true
	};
});

import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { loginSchema } from '$lib/schemas/auth';
import { fail, redirect } from '@sveltejs/kit';
import { getProfileByUUId } from '$lib/supabase/queries';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions = {
	loginWithEmail: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();

		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const resultSchema = loginSchema.safeParse({ email, password });

		if (!resultSchema.success) {
			return fail(400, {
				error: resultSchema.error?.issues?.[0]?.message ?? '',
				email
			});
		}

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return fail(400, {
				error: error.message,
				email
			});
		}

		const profile = await getProfileByUUId(data.user.id);

		return {
			success: true,
			profile,
			redirectTo: profile?.role_id === 1 ? '/app/managment/organization_managment' : '/app/'
		};
	}
} satisfies Actions;
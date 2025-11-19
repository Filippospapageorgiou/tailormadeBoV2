import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	// Extract parameters from URL
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;
	const next = url.searchParams.get('next') ?? '/';

	// Validate parameters exist
	if (!token_hash || !type) {
		redirect(303, '/auth/error?error=missing_parameters');
	}

	try {
		const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

		// Handle verification error
		if (error) {
			const errorCode = (error as any).code || 'unknown_error';
			redirect(303, `/auth/error?error=${errorCode}`);
		}

		// Success - user verified
		if (data?.user) {
			// Redirect to next page (usually /auth/set-password for invites)
			redirect(303, next);
		}

		redirect(303, '/auth/error?error=no_user_returned');
	} catch (err: any) {
		// Check if it's a SvelteKit redirect (status 303)
		// These should be re-thrown to allow the redirect to happen
		if (err?.status === 303) {
			throw err;
		}

		redirect(303, '/auth/error?error=verification_exception');
	}
};

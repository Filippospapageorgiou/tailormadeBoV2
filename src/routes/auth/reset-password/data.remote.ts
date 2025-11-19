import { form } from '$app/server';
import z from 'zod';
import { createAdminClient } from '$lib/supabase/server';
import { getProfileByEmail } from '$lib/supabase/queries';

const ResetPasswordSchema = z
	.object({
		email: z.email().trim(),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});

export const resetPasswordForm = form(ResetPasswordSchema, async ({ email, password }) => {
	try {
		// Use admin client for auth operations
		const supabase = createAdminClient();

		// Get user profile
		const user = await getProfileByEmail(email);

		if (!user) {
			return {
				success: false,
				message: 'User not found'
			};
		}

		const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
			password: password
		});

		if (error) {
			console.error('Error updating password:', error);
			return {
				success: false,
				message: error.message || 'Failed to reset password'
			};
		}
		return {
			success: true,
			message: 'Password has been reset successfully'
		};
	} catch (error) {
		console.error('=== resetPasswordForm ERROR ===');
		console.error('Error:', error);
		return {
			success: false,
			message: 'Error resetting password try again'
		};
	}
});

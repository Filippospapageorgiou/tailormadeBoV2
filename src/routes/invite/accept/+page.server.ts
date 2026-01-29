// src/routes/invite/accept/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/supabase/server';

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		throw error(400, 'Invalid invitation link. No token provided.');
	}

	try {
		// Fetch the invitation with organization and role details
		const { data: invitation, error: fetchError } = await supabase
			.from('organization_invitations')
			.select(
				`
				*,
				core_organizations (id, store_name),
				role_types (id, role_name)
			`
			)
			.eq('token', token)
			.single();

		if (fetchError || !invitation) {
			throw error(404, 'Invitation not found. It may have been cancelled or the link is invalid.');
		}

		// Check if already accepted
		if (invitation.status === 'accepted') {
			throw error(
				400,
				'This invitation has already been accepted. Please login to access your account.'
			);
		}

		// Check if cancelled
		if (invitation.status === 'cancelled') {
			throw error(
				400,
				'This invitation has been cancelled. Please contact the organization administrator.'
			);
		}

		// Check if expired
		const isExpired = new Date(invitation.expires_at) < new Date();
		if (isExpired || invitation.status === 'expired') {
			throw error(
				400,
				'This invitation has expired. Please request a new invitation from the organization administrator.'
			);
		}

		// Check if user already exists with this email
		const { data: existingUser } = await supabase
			.from('profiles')
			.select('id, email')
			.eq('email', invitation.email)
			.maybeSingle();

		return {
			invitation: {
				id: invitation.id,
				email: invitation.email,
				token: invitation.token,
				expires_at: invitation.expires_at,
				organization: {
					id: invitation.core_organizations?.id,
					name: invitation.core_organizations?.store_name || 'Unknown Organization'
				},
				role: {
					id: invitation.role_types?.id,
					name: invitation.role_types?.role_name || 'Member'
				}
			},
			userExists: !!existingUser
		};
	} catch (err: any) {
		// Re-throw SvelteKit errors
		if (err?.status) {
			throw err;
		}
		console.error('[AcceptInvitation] Error:', err);
		throw error(500, 'An error occurred while loading the invitation.');
	}
};

export const actions: Actions = {
	accept: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;
		const username = formData.get('username') as string;
		const password = formData.get('password') as string;
		const full_name = formData.get('full_name') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		// Validation
		if (!token) {
			return { success: false, message: 'Invalid invitation token' };
		}

		if (!username || username.trim().length < 2) {
			return { success: false, message: 'Username must be at least 2 characters' };
		}

		if (!password || password.length < 6) {
			return { success: false, message: 'Password must be at least 6 characters' };
		}

		if (password !== confirmPassword) {
			return { success: false, message: 'Passwords do not match' };
		}

		try {
			// Fetch the invitation
			const { data: invitation, error: fetchError } = await supabase
				.from('organization_invitations')
				.select('*')
				.eq('token', token)
				.eq('status', 'pending')
				.single();

			if (fetchError || !invitation) {
				return { success: false, message: 'Invalid or expired invitation' };
			}

			// Check expiration
			if (new Date(invitation.expires_at) < new Date()) {
				// Mark as expired
				await supabase
					.from('organization_invitations')
					.update({ status: 'expired' })
					.eq('id', invitation.id);

				return { success: false, message: 'This invitation has expired' };
			}

			// Create user with Supabase Admin
			const adminClient = createAdminClient();

			const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
				email: invitation.email,
				password: password,
				email_confirm: true, // Auto-confirm since they clicked the invite link
				user_metadata: {
					username: username.trim(),
					org_id: invitation.org_id,
					role_id: invitation.role_id
				}
			});

			if (createError) {
				console.error('[AcceptInvitation] Error creating user:', createError);

				// Check if user already exists
				if (createError.message?.includes('already been registered')) {
					return {
						success: false,
						message: 'An account with this email already exists. Please login instead.'
					};
				}

				return { success: false, message: createError.message || 'Failed to create account' };
			}

			if (!newUser.user) {
				return { success: false, message: 'Failed to create account' };
			}

			// Create profile for the user
			const { error: profileError } = await adminClient.from('profiles').insert({
				id: newUser.user.id,
				email: invitation.email,
				username: username.trim(),
				org_id: invitation.org_id,
				role_id: invitation.role_id,
				full_name:full_name,
				image_url: `https://uhrpdmoknmrbosqenotk.supabase.co/storage/v1/object/public/avatars_url/default.png`,
				badge_color: '#3b82f6'
			});

			if (profileError) {
				console.error('[AcceptInvitation] Error creating profile:', profileError);
				// Try to clean up the auth user if profile creation fails
				await adminClient.auth.admin.deleteUser(newUser.user.id);
				return { success: false, message: 'Failed to create user profile' };
			}

			// Mark invitation as accepted - USE adminClient instead of supabase
			const { data, error } = await adminClient
				.from('organization_invitations')
				.update({
					status: 'accepted',
					accepted_at: new Date().toISOString()
				})
				.eq('id', invitation.id);

			if (error) {
				console.error('Failed to update invitation:', error);
			}

			return {
				success: true,
				message: 'Account created successfully! Redirecting to login...'
			};
		} catch (err) {
			console.error('[AcceptInvitation] Unexpected error:', err);
			return { success: false, message: 'An unexpected error occurred' };
		}
	}
};

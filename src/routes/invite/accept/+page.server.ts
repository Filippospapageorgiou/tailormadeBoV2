// src/routes/invite/accept/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { createAdminClient } from '$lib/supabase/server';

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const token = url.searchParams.get('token');
	
	// Check if coming from successful registration
	const success = url.searchParams.get('success');
	if (success === 'true') {
		return {
			registrationComplete: true,
			invitation: null,
			userExists: false
		};
	}

	if (!token) {
		throw error(400, 'Μη έγκυρος σύνδεσμος πρόσκλησης.');
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
			throw error(404, 'Η πρόσκληση δεν βρέθηκε. Μπορεί να έχει ακυρωθεί ή ο σύνδεσμος να είναι μη έγκυρος.');
		}

		// Check if already accepted
		if (invitation.status === 'accepted') {
			throw error(
				400,
				'Αυτή η πρόσκληση έχει ήδη γίνει αποδεκτή. Παρακαλώ συνδέσου για να έχεις πρόσβαση στον λογαριασμό σου.'
			);
		}

		// Check if cancelled
		if (invitation.status === 'cancelled') {
			throw error(
				400,
				'Αυτή η πρόσκληση έχει ακυρωθεί. Παρακαλώ επικοινώνησε με τον διαχειριστή.'
			);
		}

		// Check if expired
		const isExpired = new Date(invitation.expires_at) < new Date();
		if (isExpired || invitation.status === 'expired') {
			throw error(
				400,
				'Αυτή η πρόσκληση έχει λήξει. Παρακαλώ ζήτησε νέα πρόσκληση από τον διαχειριστή.'
			);
		}

		// Check if user already exists with this email
		const { data: existingUser } = await supabase
			.from('profiles')
			.select('id, email')
			.eq('email', invitation.email)
			.maybeSingle();

		return {
			registrationComplete: false,
			invitation: {
				id: invitation.id,
				email: invitation.email,
				token: invitation.token,
				expires_at: invitation.expires_at,
				organization: {
					id: invitation.core_organizations?.id,
					name: invitation.core_organizations?.store_name || 'Άγνωστος Οργανισμός'
				},
				role: {
					id: invitation.role_types?.id,
					name: invitation.role_types?.role_name || 'Μέλος'
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
		throw error(500, 'Παρουσιάστηκε σφάλμα κατά τη φόρτωση της πρόσκλησης.');
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
			return { success: false, message: 'Μη έγκυρο token πρόσκλησης' };
		}

		if (!username || username.trim().length < 2) {
			return { success: false, message: 'Το username πρέπει να έχει τουλάχιστον 2 χαρακτήρες' };
		}

		if (!password || password.length < 6) {
			return { success: false, message: 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες' };
		}

		if (password !== confirmPassword) {
			return { success: false, message: 'Οι κωδικοί δεν ταιριάζουν' };
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
				return { success: false, message: 'Μη έγκυρη ή ληγμένη πρόσκληση' };
			}

			// Check expiration
			if (new Date(invitation.expires_at) < new Date()) {
				await supabase
					.from('organization_invitations')
					.update({ status: 'expired' })
					.eq('id', invitation.id);

				return { success: false, message: 'Αυτή η πρόσκληση έχει λήξει' };
			}

			// Create user with Supabase Admin
			const adminClient = createAdminClient();

			const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
				email: invitation.email,
				password: password,
				email_confirm: true,
				user_metadata: {
					username: username.trim(),
					org_id: invitation.org_id,
					role_id: invitation.role_id
				}
			});

			if (createError) {
				console.error('[AcceptInvitation] Error creating user:', createError);

				if (createError.message?.includes('already been registered')) {
					return {
						success: false,
						message: 'Υπάρχει ήδη λογαριασμός με αυτό το email. Παρακαλώ συνδέσου.'
					};
				}

				return { success: false, message: createError.message || 'Αποτυχία δημιουργίας λογαριασμού' };
			}

			if (!newUser.user) {
				return { success: false, message: 'Αποτυχία δημιουργίας λογαριασμού' };
			}

			// Create profile for the user
			const { error: profileError } = await adminClient.from('profiles').insert({
				id: newUser.user.id,
				email: invitation.email,
				username: username.trim(),
				org_id: invitation.org_id,
				role_id: invitation.role_id,
				full_name: full_name,
				image_url: `https://uhrpdmoknmrbosqenotk.supabase.co/storage/v1/object/public/avatars_url/default.png`,
				badge_color: '#3b82f6'
			});

			if (profileError) {
				console.error('[AcceptInvitation] Error creating profile:', profileError);
				await adminClient.auth.admin.deleteUser(newUser.user.id);
				return { success: false, message: 'Αποτυχία δημιουργίας προφίλ χρήστη' };
			}

			// Mark invitation as accepted
			await adminClient
				.from('organization_invitations')
				.update({
					status: 'accepted',
					accepted_at: new Date().toISOString()
				})
				.eq('id', invitation.id);

			// Redirect to clean URL with success flag
			throw redirect(303, '/invite/accept?success=true');
			
		} catch (err: any) {
			// Re-throw redirects
			if (err?.status === 303) {
				throw err;
			}
			console.error('[AcceptInvitation] Unexpected error:', err);
			return { success: false, message: 'Παρουσιάστηκε απρόσμενο σφάλμα' };
		}
	}
};
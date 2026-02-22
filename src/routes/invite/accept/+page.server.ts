// src/routes/invite/accept/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { createAdminClient } from '$lib/supabase/server';

type InvitationType = 'organization' | 'trainer';

/**
 * Determine invitation type from URL params
 */
function getInvitationType(url: URL): InvitationType {
	return url.searchParams.get('type') === 'trainer' ? 'trainer' : 'organization';
}

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const token = url.searchParams.get('token');
	const inviteType = getInvitationType(url);

	// Check if coming from successful registration
	const success = url.searchParams.get('success');
	if (success === 'true') {
		return {
			registrationComplete: true,
			invitation: null,
			userExists: false,
			inviteType
		};
	}

	if (!token) {
		throw error(400, 'Invalid invitation link.');
	}

	try {
		if (inviteType === 'trainer') {
			return await loadTrainerInvitation(supabase, token);
		} else {
			return await loadOrgInvitation(supabase, token);
		}
	} catch (err: any) {
		if (err?.status) throw err;
		console.error('[AcceptInvitation] Error:', err);
		throw error(500, 'An error occurred while loading the invitation.');
	}
};

/**
 * Load organization invitation (existing logic)
 */
async function loadOrgInvitation(supabase: any, token: string) {
	const { data: invitation, error: fetchError } = await supabase
		.from('organization_invitations')
		.select(`
			*,
			core_organizations (id, store_name),
			role_types (id, role_name)
		`)
		.eq('token', token)
		.single();

	if (fetchError || !invitation) {
		throw error(404, 'Invitation not found. It may have been cancelled or the link is invalid.');
	}

	validateInvitationStatus(invitation);

	const { data: existingUser } = await supabase
		.from('profiles')
		.select('id, email')
		.eq('email', invitation.email)
		.maybeSingle();

	return {
		registrationComplete: false,
		inviteType: 'organization' as InvitationType,
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
}

/**
 * Load trainer invitation
 */
async function loadTrainerInvitation(supabase: any, token: string) {
	const { data: invitation, error: fetchError } = await supabase
		.from('trainer_invitations')
		.select(`
			*,
			profiles!trainer_invitations_invited_by_fkey (id, full_name, username)
		`)
		.eq('token', token)
		.single();

	if (fetchError || !invitation) {
		throw error(404, 'Invitation not found. It may have been cancelled or the link is invalid.');
	}

	validateInvitationStatus(invitation);

	const { data: existingUser } = await supabase
		.from('profiles')
		.select('id, email')
		.eq('email', invitation.email)
		.maybeSingle();

	return {
		registrationComplete: false,
		inviteType: 'trainer' as InvitationType,
		invitation: {
			id: invitation.id,
			email: invitation.email,
			token: invitation.token,
			expires_at: invitation.expires_at,
			organization: null, // Trainers don't belong to an org
			role: {
				id: 3,
				name: 'Trainer'
			},
			invitedBy: invitation.profiles?.full_name || invitation.profiles?.username || 'Admin'
		},
		userExists: !!existingUser
	};
}

/**
 * Validate invitation status (shared logic)
 */
function validateInvitationStatus(invitation: any) {
	if (invitation.status === 'accepted') {
		throw error(400, 'This invitation has already been accepted. Please log in to access your account.');
	}
	if (invitation.status === 'cancelled') {
		throw error(400, 'This invitation has been cancelled. Please contact the administrator.');
	}
	const isExpired = new Date(invitation.expires_at) < new Date();
	if (isExpired || invitation.status === 'expired') {
		throw error(400, 'This invitation has expired. Please request a new one from the administrator.');
	}
}

export const actions: Actions = {
	accept: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;
		const username = formData.get('username') as string;
		const password = formData.get('password') as string;
		const full_name = formData.get('full_name') as string;
		const confirmPassword = formData.get('confirmPassword') as string;
		const inviteType = (formData.get('inviteType') as string) || getInvitationType(url);

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
			if (inviteType === 'trainer') {
				return await acceptTrainerInvitation(supabase, token, username, password, full_name, url);
			} else {
				return await acceptOrgInvitation(supabase, token, username, password, full_name, url);
			}
		} catch (err: any) {
			if (err?.status === 303) throw err;
			console.error('[AcceptInvitation] Unexpected error:', err);
			return { success: false, message: 'An unexpected error occurred' };
		}
	}
};

/**
 * Accept organization invitation (existing logic, extracted)
 */
async function acceptOrgInvitation(
	supabase: any,
	token: string,
	username: string,
	password: string,
	full_name: string,
	url: URL
) {
	const { data: invitation, error: fetchError } = await supabase
		.from('organization_invitations')
		.select('*')
		.eq('token', token)
		.eq('status', 'pending')
		.single();

	if (fetchError || !invitation) {
		return { success: false, message: 'Invalid or expired invitation' };
	}

	if (new Date(invitation.expires_at) < new Date()) {
		await supabase
			.from('organization_invitations')
			.update({ status: 'expired' })
			.eq('id', invitation.id);
		return { success: false, message: 'This invitation has expired' };
	}

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
		console.error('[AcceptOrgInvitation] Error creating user:', createError);
		if (createError.message?.includes('already been registered')) {
			return { success: false, message: 'An account already exists with this email. Please log in.' };
		}
		return { success: false, message: createError.message || 'Failed to create account' };
	}

	if (!newUser.user) {
		return { success: false, message: 'Failed to create account' };
	}

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
		console.error('[AcceptOrgInvitation] Error creating profile:', profileError);
		await adminClient.auth.admin.deleteUser(newUser.user.id);
		return { success: false, message: 'Failed to create user profile' };
	}

	await adminClient
		.from('organization_invitations')
		.update({ status: 'accepted', accepted_at: new Date().toISOString() })
		.eq('id', invitation.id);

	throw redirect(303, '/invite/accept?success=true');
}

/**
 * Accept trainer invitation — creates profile WITHOUT org_id, with role_id = 3
 */
async function acceptTrainerInvitation(
	supabase: any,
	token: string,
	username: string,
	password: string,
	full_name: string,
	url: URL
) {
	const { data: invitation, error: fetchError } = await supabase
		.from('trainer_invitations')
		.select('*')
		.eq('token', token)
		.eq('status', 'pending')
		.single();

	if (fetchError || !invitation) {
		return { success: false, message: 'Invalid or expired invitation' };
	}

	if (new Date(invitation.expires_at) < new Date()) {
		await supabase
			.from('trainer_invitations')
			.update({ status: 'expired' })
			.eq('id', invitation.id);
		return { success: false, message: 'This invitation has expired' };
	}

	const adminClient = createAdminClient();

	// Create auth user — NO org_id for trainers
	const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
		email: invitation.email,
		password: password,
		email_confirm: true,
		user_metadata: {
			username: username.trim(),
			role_id: 3 // trainer
		}
	});

	if (createError) {
		console.error('[AcceptTrainerInvitation] Error creating user:', createError);
		if (createError.message?.includes('already been registered')) {
			return { success: false, message: 'An account already exists with this email. Please log in.' };
		}
		return { success: false, message: createError.message || 'Failed to create account' };
	}

	if (!newUser.user) {
		return { success: false, message: 'Failed to create account' };
	}

	// Create profile WITHOUT org_id — trainers are platform-level users
	const { error: profileError } = await adminClient.from('profiles').insert({
		id: newUser.user.id,
		email: invitation.email,
		username: username.trim(),
		org_id: null, // Trainers don't belong to a specific org
		role_id: 3,   // trainer role
		full_name: full_name,
		image_url: `https://uhrpdmoknmrbosqenotk.supabase.co/storage/v1/object/public/avatars_url/default.png`,
		badge_color: '#D4A574' // warm coffee tone for trainers
	});

	if (profileError) {
		console.error('[AcceptTrainerInvitation] Error creating profile:', profileError);
		// Rollback: delete the auth user
		await adminClient.auth.admin.deleteUser(newUser.user.id);
		return { success: false, message: 'Failed to create trainer profile' };
	}

	// Mark invitation as accepted
	await adminClient
		.from('trainer_invitations')
		.update({ status: 'accepted', accepted_at: new Date().toISOString() })
		.eq('id', invitation.id);

	throw redirect(303, '/invite/accept?success=true&type=trainer');
}
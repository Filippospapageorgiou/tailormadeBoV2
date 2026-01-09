import { query, command, form, prerender } from '$app/server';
import { createServerClient, createAdminClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Profile } from '$lib/models/database.types';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getUserOrgId, getUserProfile, getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import crypto from 'crypto';
import { sendOrganizationInvitation } from '$lib/emails/organization-invitations';

/**
 * Generate a secure random token for invitations
 */
function generateSecureToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

export const authenticatedAccess = query(async () => {
	const supabase = createServerClient();
	const orgId = await getUserOrgId();
	const profile = await getUserProfileWithRoleCheck([1, 2]);

	return {
		profile,
		success: true
	};
});

// ======================== QUERIES ==============

export const getAllUserFromOrg = query(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	// get orgId from admin user
	const { data: orgId, error: orgIdError } = await supabase
		.from('profiles')
		.select('org_id')
		.eq('id', user.id)
		.single();
	if (orgIdError) {
		console.error('Error fecthing users orgId: ', orgIdError);
		return {
			success: false,
			message: 'An error occured try again later'
		};
	}

	const { data: users, error: userError } = await supabase
		.from('profiles')
		.select(
			`
                    *,
                role_types!role_id(role_name)
            `
		)
		.eq('org_id', orgId.org_id);

	const flattenedUsers: Profile[] =
		users?.map((user) => ({ ...user, role_name: user.role_types?.role_name || '' })) || [];

	if (userError) {
		console.error('Error fetching user from organization: ', userError);
		return {
			success: false,
			message: 'An error occured while trying to read users'
		};
	}

	//get Role types for updating users and so on
	const { data: roleTypes, error: roleTypesError } = await supabase.from('role_types').select('*');

	if (roleTypesError) {
		console.error('Error fetching role types: ', roleTypesError);
		return {
			success: false,
			message: 'An error occured while trying to read role types'
		};
	}

	return {
		success: true,
		message: 'Success reading data from database',
		flattenedUsers,
		roleTypes
	};
});

// ======================== COMMANDS ==============

const updateUserRoleSchema = z.object({
	userId: z.string({ error: 'Invalid user ID format' }),
	roleId: z.number().int().positive({ error: 'Role ID must be a positive integer' }),
	canCloseRegister: z.boolean({ error: 'Registry must me a boolean vallue' }),
	isManager: z.boolean({ error: 'Registry must me a boolean vallue' })
});

export const updateUserRole = command(
	updateUserRoleSchema,
	async ({ userId, roleId, canCloseRegister, isManager }) => {
		const supabase = createServerClient();
		try {
			const { error } = await supabase
				.from('profiles')
				.update({ role_id: roleId, can_close_register: canCloseRegister, is_manager: isManager })
				.eq('id', userId);

			if (error) {
				console.error('Error updating user role:', error);
				return {
					success: false,
					message: 'Failed to update user role'
				};
			}

			return {
				success: true,
				message: 'User role updated successfully'
			};
		} catch (err) {
			console.error('Unexpected error during role update:', err);
			return {
				success: false,
				message: 'An unexpected error occurred while updating user role'
			};
		}
	}
);

const inviteUserEmailschema = z.object({
	email: z.email({ error: 'invalid email cannog ' }).trim(),
	expirationDays: z.number().int().min(1).max(30).default(7) // Default 7 days expiration
});

export const inviteUser = query(inviteUserEmailschema, async ({ email, expirationDays }) => {
	const supabase = createServerClient();
	const adminClient = createAdminClient();

	try {
		const profile = await getUserProfile();

		// Check if there's already a pending invitation for this email + org
		const { data: existingInvitation } = await supabase
			.from('organization_invitations')
			.select('id, status, expires_at')
			.eq('email', email)
			.eq('org_id', profile.org_id)
			.eq('status', 'pending')
			.maybeSingle();

		if (existingInvitation) {
			const isExpired = new Date(existingInvitation.expires_at) < new Date();
			if (!isExpired) {
				return {
					success: false,
					message: 'A pending invitation already exists for this email. You can resend it instead.'
				};
			}
		}

		const token = generateSecureToken();

		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expirationDays);

		// Create invitation record
		const { data: invitation, error: insertError } = await supabase
			.from('organization_invitations')
			.insert({
				org_id: profile.org_id,
				email: email,
				role_id: 5,
				token: token,
				invited_by: profile.id,
				status: 'pending',
				expires_at: expiresAt.toISOString()
			})
			.select()
			.single();

		if (insertError) {
			console.error('[inviteUserToOrg] Error creating invitation:', insertError);
			return {
				success: false,
				message: 'Failed to create invitation'
			};
		}

		// Send invitation email via Resend
		const emailResult = await sendOrganizationInvitation({
			recipientEmail: email,
			organizationName: 'Tailor Made coffee roasters',
			roleName: 'employee',
			inviterName: profile.username || profile.email,
			inviteToken: token,
			expiresAt: expiresAt
		});

		if (!emailResult.success) {
			await supabase.from('organization_invitations').delete().eq('id', invitation.id);
			return {
				success: false,
				message: emailResult.message || 'Failed to send invitation email'
			};
		}

		return {
			success: true,
			message: 'User invited successfully'
		};
	} catch (error) {
		console.error('Error inviting user: ', error);
		return {
			success: false,
			message: 'An error occurred trying to invite user'
		};
	}
});

const deleteUserSchema = z.object({
	userId: z.string({ error: 'Invalid user ID format' })
});

export const deleteUser = command(deleteUserSchema, async ({ userId }) => {
	const adminClient = createAdminClient();

	try {
		// Delete user from Supabase Auth
		const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

		if (authError) {
			console.error('Error deleting user from auth:', authError);
			return {
				success: false,
				message: 'Failed to delete user from authentication system'
			};
		}

		// The profile will be deleted automatically via CASCADE from the database trigger

		return {
			success: true,
			message: 'User deleted successfully'
		};
	} catch (err) {
		console.error('Unexpected error during user deletion:', err);
		return {
			success: false,
			message: 'An unexpected error occurred while deleting user'
		};
	}
});

const updateBadgeColorSchema = z.object({
	userId: z.string({ error: 'Invalid user ID format' }),
	badgeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
		error: 'Invalid color format. Must be a hex color (e.g., #3b82f6)'
	})
});

export const updateBadgeColor = command(updateBadgeColorSchema, async ({ userId, badgeColor }) => {
	const supabase = createServerClient();

	try {
		const { error } = await supabase
			.from('profiles')
			.update({ badge_color: badgeColor })
			.eq('id', userId);

		if (error) {
			console.error('Error updating badge color:', error);
			return {
				success: false,
				message: 'Failed to update badge color'
			};
		}

		return {
			success: true,
			message: 'Badge color updated successfully'
		};
	} catch (err) {
		console.error('Unexpected error during badge color update:', err);
		return {
			success: false,
			message: 'An unexpected error occurred while updating badge color'
		};
	}
});

// src/routes/app/organization_managment/[id]/data.remote.ts
import { query, command } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { sendOrganizationInvitation, resendOrganizationInvitation } from '$lib/emails/organization-invitations';
import { z } from 'zod/v4';
import { generateSecureToken } from '$lib/utils';

/**
 * Authenticated access check - verifies user has super_admin role
 */
export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([1]);
	return {
		success: true,
		profile
	};
});

/**
 * Schema for inviting a user to a specific organization
 */
const inviteUserToOrgSchema = z.object({
	email: z.email({ error: 'Invalid email address' }).trim().toLowerCase(),
	orgId: z.number().int().positive({ error: 'Organization ID must be a positive integer' }),
	roleId: z.number().int().positive({ error: 'Role ID must be a positive integer' }),
	expirationDays: z.number().int().min(1).max(30).default(7) // Default 7 days expiration
});

/**
 * Invite a user to a specific organization with a specific role
 * Uses Resend for email delivery instead of Supabase Auth
 */
export const inviteUserToOrg = command(inviteUserToOrgSchema, async ({ email, orgId, roleId, expirationDays }) => {
	const supabase = createServerClient();

	try {
		// Verify the inviter is a super_admin
		const profile = await getUserProfileWithRoleCheck([1]);

		if (!profile) {
			return {
				success: false,
				message: 'Unauthorized: Only super admins can invite users to organizations'
			};
		}

		// Verify the organization exists
		const { data: org, error: orgError } = await supabase
			.from('core_organizations')
			.select('id, store_name')
			.eq('id', orgId)
			.single();

		if (orgError || !org) {
			return {
				success: false,
				message: 'Organization not found'
			};
		}

		// Get role name for the email
		const { data: role, error: roleError } = await supabase
			.from('role_types')
			.select('id, role_name')
			.eq('id', roleId)
			.single();

		if (roleError || !role) {
			return {
				success: false,
				message: 'Invalid role selected'
			};
		}

		// Check if user already exists in this organization
		const { data: existingUser } = await supabase
			.from('profiles')
			.select('id, email')
			.eq('email', email)
			.eq('org_id', orgId)
			.maybeSingle();

		if (existingUser) {
			return {
				success: false,
				message: 'This user is already a member of this organization'
			};
		}

		// Check if there's already a pending invitation for this email + org
		const { data: existingInvitation } = await supabase
			.from('organization_invitations')
			.select('id, status, expires_at')
			.eq('email', email)
			.eq('org_id', orgId)
			.eq('status', 'pending')
			.maybeSingle();

		if (existingInvitation) {
			// Check if it's expired
			const isExpired = new Date(existingInvitation.expires_at) < new Date();
			if (!isExpired) {
				return {
					success: false,
					message: 'A pending invitation already exists for this email. You can resend it instead.'
				};
			}
			// If expired, we'll create a new one (the old one stays as expired)
		}

		// Generate secure token
		const token = generateSecureToken();

		// Calculate expiration date
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expirationDays);

		// Create invitation record
		const { data: invitation, error: insertError } = await supabase
			.from('organization_invitations')
			.insert({
				org_id: orgId,
				email: email,
				role_id: roleId,
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
			organizationName: org.store_name || 'Unknown Organization',
			roleName: role.role_name,
			inviterName: profile.username || profile.email,
			inviteToken: token,
			expiresAt: expiresAt
		});

		if (!emailResult.success) {
			// Rollback: delete the invitation if email failed
			await supabase
				.from('organization_invitations')
				.delete()
				.eq('id', invitation.id);

			return {
				success: false,
				message: emailResult.message || 'Failed to send invitation email'
			};
		}

		return {
			success: true,
			message: `Invitation sent successfully to ${email}`,
			invitation: invitation
		};
	} catch (err) {
		console.error('[inviteUserToOrg] Unexpected error:', err);
		return {
			success: false,
			message: 'An unexpected error occurred while sending the invitation'
		};
	}
});

/**
 * Schema for resending an invitation
 */
const resendInvitationSchema = z.object({
	invitationId: z.number().int().positive()
});

/**
 * Resend an existing invitation (generates new token and extends expiration)
 */
export const resendInvitation = command(resendInvitationSchema, async ({ invitationId }) => {
	const supabase = createServerClient();

	try {
		const profile = await getUserProfileWithRoleCheck([1]);

		// Fetch the existing invitation with org and role details
		const { data: invitation, error: fetchError } = await supabase
			.from('organization_invitations')
			.select(`
				*,
				core_organizations (id, store_name),
				role_types (id, role_name)
			`)
			.eq('id', invitationId)
			.single();

		if (fetchError || !invitation) {
			return {
				success: false,
				message: 'Invitation not found'
			};
		}

		if (invitation.status === 'accepted') {
			return {
				success: false,
				message: 'This invitation has already been accepted'
			};
		}

		if (invitation.status === 'cancelled') {
			return {
				success: false,
				message: 'This invitation has been cancelled'
			};
		}

		// Generate new token and expiration
		const newToken = generateSecureToken();
		const newExpiresAt = new Date();
		newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days from now

		// Update invitation with new token and expiration
		const { error: updateError } = await supabase
			.from('organization_invitations')
			.update({
				token: newToken,
				expires_at: newExpiresAt.toISOString(),
				status: 'pending' // Reset to pending if it was expired
			})
			.eq('id', invitationId);

		if (updateError) {
			console.error('[resendInvitation] Error updating invitation:', updateError);
			return {
				success: false,
				message: 'Failed to update invitation'
			};
		}

		// Resend email
		const emailResult = await resendOrganizationInvitation({
			recipientEmail: invitation.email,
			organizationName: invitation.core_organizations?.store_name || 'Unknown Organization',
			roleName: invitation.role_types?.role_name || 'Member',
			inviterName: profile.username || profile.email,
			inviteToken: newToken,
			expiresAt: newExpiresAt
		});

		if (!emailResult.success) {
			return {
				success: false,
				message: emailResult.message || 'Failed to resend invitation email'
			};
		}

		return {
			success: true,
			message: `Invitation resent successfully to ${invitation.email}`
		};
	} catch (err) {
		console.error('[resendInvitation] Unexpected error:', err);
		return {
			success: false,
			message: 'An unexpected error occurred'
		};
	}
});

/**
 * Schema for cancelling an invitation
 */
const cancelInvitationSchema = z.object({
	invitationId: z.number().int().positive()
});

/**
 * Cancel a pending invitation
 */
export const cancelInvitation = command(cancelInvitationSchema, async ({ invitationId }) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]);

		const { data: invitation, error: fetchError } = await supabase
			.from('organization_invitations')
			.select('id, status')
			.eq('id', invitationId)
			.single();

		if (fetchError || !invitation) {
			return {
				success: false,
				message: 'Invitation not found'
			};
		}

		if (invitation.status === 'accepted') {
			return {
				success: false,
				message: 'Cannot cancel an accepted invitation'
			};
		}

		const { error: updateError } = await supabase
			.from('organization_invitations')
			.update({ status: 'cancelled' })
			.eq('id', invitationId);

		if (updateError) {
			console.error('[cancelInvitation] Error cancelling invitation:', updateError);
			return {
				success: false,
				message: 'Failed to cancel invitation'
			};
		}

		return {
			success: true,
			message: 'Invitation cancelled successfully'
		};
	} catch (err) {
		console.error('[cancelInvitation] Unexpected error:', err);
		return {
			success: false,
			message: 'An unexpected error occurred'
		};
	}
});

/**
 * Get pending invitations for an organization
 */
const getOrgInvitationsSchema = z.object({
	orgId: z.number().int().positive()
});

export const getOrganizationInvitations = query(getOrgInvitationsSchema, async ({ orgId }) => {
	const supabase = createServerClient();

	try {
		const { data: invitations, error } = await supabase
			.from('organization_invitations')
			.select(`
				*,
				role_types (id, role_name),
				profiles!invited_by (id, username, email)
			`)
			.eq('org_id', orgId)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('[getOrganizationInvitations] Error:', error);
			return {
				success: false,
				invitations: []
			};
		}

		// Check and update expired invitations
		const now = new Date();
		const updatedInvitations = invitations?.map(inv => {
			if (inv.status === 'pending' && new Date(inv.expires_at) < now) {
				return { ...inv, status: 'expired' };
			}
			return inv;
		}) || [];

		return {
			success: true,
			invitations: updatedInvitations
		};
	} catch (err) {
		console.error('[getOrganizationInvitations] Error:', err);
		return {
			success: false,
			invitations: []
		};
	}
});

/**
 * Get organization stats
 */
const getOrgStatsSchema = z.object({
	orgId: z.number().int().positive()
});

export const getOrganizationStats = query(getOrgStatsSchema, async ({ orgId }) => {
	const supabase = createServerClient();

	try {
		// Fetch employee count
		const { count: employeeCount, error: empError } = await supabase
			.from('profiles')
			.select('*', { count: 'exact', head: true })
			.eq('org_id', orgId);

		if (empError) {
			console.error('[getOrganizationStats] Error fetching employee count:', empError);
		}

		// Fetch equipment stats
		const { data: equipment, error: eqError } = await supabase
			.from('equipment')
			.select('status')
			.eq('org_id', orgId);

		if (eqError) {
			console.error('[getOrganizationStats] Error fetching equipment:', eqError);
		}

		// Fetch pending invitations count
		const { count: pendingInvitations, error: invError } = await supabase
			.from('organization_invitations')
			.select('*', { count: 'exact', head: true })
			.eq('org_id', orgId)
			.eq('status', 'pending')
			.gt('expires_at', new Date().toISOString());

		if (invError) {
			console.error('[getOrganizationStats] Error fetching invitations:', invError);
		}

		const equipmentCount = equipment?.length || 0;
		const activeEquipment = equipment?.filter((e) => e.status === 'operational').length || 0;
		const maintenanceEquipment = equipment?.filter((e) => e.status === 'maintenance').length || 0;

		return {
			success: true,
			stats: {
				employeeCount: employeeCount || 0,
				equipmentCount,
				activeEquipment,
				maintenanceEquipment,
				pendingInvitations: pendingInvitations || 0
			}
		};
	} catch (err) {
		console.error('[getOrganizationStats] Error:', err);
		return {
			success: false,
			stats: {
				employeeCount: 0,
				equipmentCount: 0,
				activeEquipment: 0,
				maintenanceEquipment: 0,
				pendingInvitations: 0
			}
		};
	}
});
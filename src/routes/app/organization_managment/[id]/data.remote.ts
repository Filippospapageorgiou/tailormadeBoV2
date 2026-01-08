import { query, command } from '$app/server';
import { createServerClient, createAdminClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { z } from 'zod/v4';

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
	email: z.email({ error: 'Invalid email address' }).trim(),
	orgId: z.number().int().positive({ error: 'Organization ID must be a positive integer' }),
	roleId: z.number().int().positive({ error: 'Role ID must be a positive integer' })
});

/**
 * Invite a user to a specific organization with a specific role
 * This is used by super_admin to invite users to any organization
 */
export const inviteUserToOrg = command(inviteUserToOrgSchema, async ({ email, orgId, roleId }) => {
	const supabase = createServerClient();
	const adminClient = createAdminClient();

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

		// Check if user is already in this organization
		const { data: existingUser, error: existingError } = await supabase
			.from('profiles')
			.select('id, email')
			.eq('email', email)
			.eq('org_id', orgId)
			.maybeSingle();

		if (existingUser) {
			return {
				success: false,
				message: 'User is already a member of this organization'
			};
		}

		// Send the invitation via Supabase Auth Admin
		const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
			data: {
				invited_at: new Date().toISOString(),
				org_id: orgId,
				role_id: roleId,
				invited_by: profile.id
			}
		});

		if (error) {
			console.error('[inviteUserToOrg] Error inviting user:', error);
			return {
				success: false,
				message: error.message || 'Failed to send invitation'
			};
		}

		return {
			success: true,
			message: `Invitation sent successfully to ${email}`
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
 * Get organization stats (can be used for refresh)
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

		const equipmentCount = equipment?.length || 0;
		const activeEquipment = equipment?.filter((e) => e.status === 'operational').length || 0;
		const maintenanceEquipment = equipment?.filter((e) => e.status === 'maintenance').length || 0;

		return {
			success: true,
			stats: {
				employeeCount: employeeCount || 0,
				equipmentCount,
				activeEquipment,
				maintenanceEquipment
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
				maintenanceEquipment: 0
			}
		};
	}
});
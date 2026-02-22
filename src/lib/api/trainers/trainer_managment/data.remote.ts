import { query, command } from '$app/server';
import { createServerClient, createAdminClient } from '$lib/supabase/server';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import crypto from 'crypto';
import type { Organization } from '$lib/models/database.types';
import { getUserProfile, getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { sendTrainerInvitation } from '$lib/emails/trainer-invitation';

/**
 * Get all trainers with their assigned organizations count
 * trainers have org_id = 3
 **/
export const getTrainers = query(async () => {
	const supabase = createServerClient();

	try {
		const { data: trainers, error: trainersError } = await supabase
			.from('profiles')
			.select(
				`*
                    trainer_org_assigments!trainer_org_assigments_trainer_id_fkey (
                        *
                        core_organizations!trainer_org_assigments_org_id_fkey (
                            *)
                        )
            `
			)
			.eq('role_id', 3)
			.order('created_at', { ascending: false });

		if (trainersError) {
			console.error('[getTrainers] Error fetching trainers data: ', trainersError);
			return {
				success: false,
				message: 'Σφάλμα κάτα την ανάκτηση δεδομένων',
				trainers: []
			};
		}

		return {
			success: true,
			message: 'Επιτυχία',
			trainers: trainers ?? []
		};
	} catch (err) {
		console.error('[getTrainers] Error fetching trainers data: ', err);
		return {
			success: false,
			message: 'Σφάλμα κάτα την ανάκτηση δεδομένων',
			trainers: []
		};
	}
});

/**
 * Get a single trainer's detailed info
 */
const getTrainerByIdSchema = z.object({
	trainerId: z.uuid()
});

export const getTrainerById = query(getTrainerByIdSchema, async ({ trainerId }) => {
	const supabase = createServerClient();
	try {
		const { data: trainer, error: trainerError } = await supabase
			.from('profiles')
			.select(
				`*
      trainer_org_assigments!trainer_org_assigments_trainer_id_fkey (
        *
        core_organizations!trainer_org_assigments_org_id_fkey (
          *
        )
      )
    `
			)
			.eq('id', trainerId)
			.eq('role_id', 3)
			.single();

		if (trainerError) {
			console.error('[getTrainerById] Error:', trainerError);
			return {
				success: false,
				message: 'Σφάλμα κάτα την ανάκτηση δεδομένων',
				trainer: null
			};
		}

		return trainer;
	} catch (err) {
		console.error('[getTrainerById] Error fetching trainers data: ', err);
		return {
			success: false,
			message: 'Σφάλμα κάτα την ανάκτηση δεδομένων',
			trainer: null
		};
	}
});

// ============================================================
// TAB 2: ASSIGN TRAINER TO ORG
// ============================================================

export const getAllOrganizations = query(async () => {
	const supabase = createServerClient();
	try {
		const { data: organizations, error: organizationError } = await supabase
			.from('core_organizations')
			.select('*')
			.overrideTypes<Organization[]>();

		if (organizationError) {
			console.error('[getAllOrganizations] Error fetching all organizations: ', organizationError);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση οργανισμών',
				organizations: []
			};
		}

		return {
			success: true,
			message: 'Επιτυχής ανάκτηση οργανισμών',
			organizations: organizations ?? []
		};
	} catch (err) {
		console.error('[getAllOrganizations] Error fetching all organizations: ', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ανάκτηση οργανισμών',
			organizations: []
		};
	}
});

/**
 * Get all trainer-org assignments with full details
 */
export const getTrainerAssignments = query(async () => {
	const supabase = createServerClient();
	const { data: assignments, error: assignError } = await supabase
		.from('trainer_org_assigments')
		.select(
			`
    *,
    profiles!trainer_id (*),
    core_organizations!org_id (*),
    assigned_by_profile:profiles!assigned_by (*)
  `
		)
		.order('created_at', { ascending: false });

	if (assignError) {
		console.error('[getTrainerAssignments] Error:', assignError);
		return {
			success: false,
			message: 'Σφάλμα κάτα την ανάκτηση δεδομένων',
			assignments: []
		};
	}

	return {
		success: true,
		message: 'Επιτυχία',
		assignments: assignments ?? []
	};
});

/**
 * Assign a trainer to an organization for evalution
 */
const assignTrainerSchema = z.object({
	trainerId: z.uuid(),
	orgId: z.number().int().positive(),
	visitDate: z.string()
});

export const assignTrainerToOrg = command(
	assignTrainerSchema,
	async ({ trainerId, orgId, visitDate }) => {
		const supabase = createServerClient();
		const profile = await getUserProfile();
		try {
			//check if assignment exists
			const { data: exists } = await supabase
				.from('trainer_org_assigments')
				.select('id, is_active')
				.eq('trainer_id', trainerId)
				.eq('org_id', orgId)
				.maybeSingle();

			if (exists) {
				if (exists.is_active) {
					return {
						success: false,
						message: 'Σφάλμα υπάρχει είδη αναχτοί ανάθεση για τον οργανισμό'
					};
				}
				const { error: updateError } = await supabase
					.from('trainer_org_assigments')
					.update({ is_active: true, updated_at: new Date().toISOString() })
					.eq('id', exists.id);

				if (updateError) {
					console.error('[assignTrainerToOrg] Reactivation error:', updateError);
					return {
						success: false,
						message: 'Σφάλμα κάτα την ανανεώση ανάθεσης'
					};
				}

				return { success: true, reactivated: true };
			}

			// Create new assignment
			const { error: insertError } = await supabase.from('trainer_org_assigments').insert({
				trainer_id: trainerId,
				org_id: orgId,
				assigned_by: profile.id,
				visit_date: visitDate,
				is_active: true
			});

			if (insertError) {
				console.error('[assignTrainerToOrg] Reactivation error:', insertError);
				return {
					success: false,
					message: 'Σφάλμα κάτα την πρόσθεση ανάθεσης'
				};
			}

			return { success: true, reactivated: false };
		} catch (err) {
			console.error('[assignTrainerToOrg] Reactivation error:', err);
			return {
				success: false,
				message: 'Σφάλμα κάτα την ανανεώση ανάθεσης'
			};
		}
	}
);

// Add this to your existing data.remote.ts (or wherever assignTrainerToOrg lives)
// This replaces the client-side loop with a single server command

const bulkAssignTrainerSchema = z.object({
	trainerId: z.uuid(),
	orgIds: z.array(z.number().int().positive()).min(1),
	visitDate: z.string()
});

export const bulkAssignTrainerToOrgs = command(
	bulkAssignTrainerSchema,
	async ({ trainerId, orgIds, visitDate }) => {
		const supabase = createServerClient();
		const profile = await getUserProfile();

		const results: { orgId: number; success: boolean; reactivated?: boolean; message?: string }[] = [];

		try {
			for (const orgId of orgIds) {
				// Check if assignment exists
				const { data: exists } = await supabase
					.from('trainer_org_assigments')
					.select('id, is_active')
					.eq('trainer_id', trainerId)
					.eq('org_id', orgId)
					.maybeSingle();

				if (exists) {
					if (exists.is_active) {
						results.push({
							orgId,
							success: false,
							message: 'Υπάρχει ήδη ενεργή ανάθεση'
						});
						continue;
					}

					const { error: updateError } = await supabase
						.from('trainer_org_assigments')
						.update({ is_active: true, updated_at: new Date().toISOString() })
						.eq('id', exists.id);

					if (updateError) {
						console.error('[bulkAssignTrainerToOrgs] Reactivation error:', updateError);
						results.push({ orgId, success: false, message: 'Σφάλμα ανανέωσης' });
						continue;
					}

					results.push({ orgId, success: true, reactivated: true });
				} else {
					const { error: insertError } = await supabase
						.from('trainer_org_assigments')
						.insert({
							trainer_id: trainerId,
							org_id: orgId,
							assigned_by: profile.id,
							visit_date: visitDate,
							is_active: true
						});

					if (insertError) {
						console.error('[bulkAssignTrainerToOrgs] Insert error:', insertError);
						results.push({ orgId, success: false, message: 'Σφάλμα εισαγωγής' });
						continue;
					}

					results.push({ orgId, success: true, reactivated: false });
				}
			}

			// ─── Send ONE email after all assignments ───
			const successfulOrgIds = results.filter((r) => r.success).map((r) => r.orgId);

			if (successfulOrgIds.length > 0) {
				// Fetch trainer profile
				const { data: trainerProfile } = await supabase
					.from('profiles')
					.select('full_name, username, email')
					.eq('id', trainerId)
					.single();

				// Fetch org details for successful assignments
				const { data: orgs } = await supabase
					.from('core_organizations')
					.select('id, store_name, location')
					.in('id', successfulOrgIds);

				if (trainerProfile?.email && orgs && orgs.length > 0) {
					// Dynamic import to avoid circular deps
					const { sendTrainerAssignmentNotification } = await import(
						'$lib/emails/trainer-assignment-notification'
					);

					await sendTrainerAssignmentNotification({
						recipientEmail: trainerProfile.email,
						trainerName: trainerProfile.full_name ?? trainerProfile.username ?? 'Trainer',
						assignedBy: profile.full_name ?? profile.username ?? 'Διαχειριστής',
						visitDate,
						organizations: orgs.map((o) => ({
							id: o.id,
							store_name: o.store_name,
							location: o.location ?? undefined
						}))
					});
				}
			}

			const successCount = results.filter((r) => r.success).length;
			const failCount = results.filter((r) => !r.success).length;

			return {
				success: successCount > 0,
				results,
				message:
					failCount === 0
						? `${successCount} αναθέσεις ολοκληρώθηκαν`
						: `${successCount} επιτυχείς, ${failCount} αποτυχίες`
			};
		} catch (err) {
			console.error('[bulkAssignTrainerToOrgs] Unexpected error:', err);
			return {
				success: false,
				results,
				message: 'Σφάλμα κατά την ανάθεση'
			};
		}
	}
);

/**
 * Unassign (deactivate) a trainer from an organization
 */
const unassignTrainerSchema = z.object({
	assignmentId: z.number().int().positive()
});

export const unassignTrainer = command(unassignTrainerSchema, async ({ assignmentId }) => {
	const supabase = createServerClient();

	const { error: updateError } = await supabase
		.from('trainer_org_assigments')
		.update({ is_active: false, updated_at: new Date().toISOString() })
		.eq('id', assignmentId);

	if (updateError) {
		console.error('[unassignTrainer] Error:', updateError);
		throw error(500, 'Failed to unassign trainer');
	}

	return { success: true };
});

/**
 * Delete an assignment permanently
 */
const deleteAssignmentSchema = z.object({
	assignmentId: z.number().int().positive()
});

export const deleteAssignment = command(deleteAssignmentSchema, async ({ assignmentId }) => {
	const supabase = createServerClient();
	const { error: deleteError } = await supabase
		.from('trainer_org_assigments')
		.delete()
		.eq('id', assignmentId);

	if (deleteError) {
		console.error('[deleteAssignment] Error:', deleteError);
		throw error(500, 'Failed to delete assignment');
	}

	return { success: true };
});

// ============================================================
// TAB 3: EVALUATIONS OVERVIEW
// ============================================================
/**
 * Get all evaluations across all trainers
 * Shows: status, overall_rating, visit_date, store name, trainer name
 */
export const getEvaluations = query(async () => {
	const supabase = createServerClient();

	const { data: evaluations, error: evalError } = await supabase
		.from('store_evaluations')
		.select(
			`*,
        core_organizations!store_evaluations_org_id_fkey (
            *
        ),
        profiles!store_evaluations_trainer_id_fkey (
            *
        ),
        reviewed_by_profile:profiles!store_evaluations_reviewed_by_fkey (
            *
        )
        `
		)
		.order('visit_date', { ascending: false });
	
	if (evalError) {
		console.error('[getEvaluations] Error:', evalError);
		throw error(500, 'Failed to fetch evaluations');
	}

	return {
		evaluations: evaluations ?? []
	};
});

// ============================================================
// TAB 4: INVITE TRAINER
// ============================================================

/**
 * Get all trainer invitations
 */
export const getTrainerInvitations = query(async () => {
	const supabase = createServerClient();
	await getUserProfileWithRoleCheck([1]);

	const { data: invitations, error: invError } = await supabase
		.from('trainer_invitations')
		.select(
			`
      id,
      email,
      status,
      expires_at,
      accepted_at,
      created_at,
      profiles!trainer_invitations_invited_by_fkey (
        id,
        full_name
      )
    `
		)
		.order('created_at', { ascending: false });

	if (invError) {
		console.error('[getTrainerInvitations] Error:', invError);
		throw error(500, 'Failed to fetch trainer invitations');
	}

	return invitations ?? [];
});

/**
 * Send a trainer invitation via email
 */
const inviteTrainerSchema = z.object({
	email: z.email().transform((val) => val.toLowerCase().trim())
});

export const inviteTrainer = command(inviteTrainerSchema, async ({ email }) => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([1]);

	// Check if email already has a pending invitation
	const { data: existingInvite } = await supabase
		.from('trainer_invitations')
		.select('id, status')
		.eq('email', email)
		.eq('status', 'pending')
		.maybeSingle();

	if (existingInvite) {
		console.error('[inviteTrainer] existing trainer invitation');
		return {
			success: false,
			message: 'Υπάρχει ενεργή πρόσκληση για το email'
		};
	}

	// Check if email is already a trainer in the system
	const { data: existingProfile } = await supabase
		.from('profiles')
		.select('id, role_id')
		.eq('email', email)
		.eq('role_id', 3)
		.maybeSingle();

	if (existingProfile) {
		return {
			success: false,
			message: 'Είναι είδη trainer'
		};
	}

	// Generate secure token
	const token = crypto.randomBytes(32).toString('hex');

	// Set expiration to 7 days from now
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7);

	// Insert invitation
	const { data: invitation, error: insertError } = await supabase
		.from('trainer_invitations')
		.insert({
			email,
			token,
			invited_by: profile.id,
			status: 'pending',
			expires_at: expiresAt.toISOString()
		})
		.select('id, email, token, expires_at')
		.single();

	if (insertError) {
		console.error('[inviteTrainer] Insert error:', insertError);
		return {
			success: false,
			message: 'Σφάλμα κάτα την δημιουργία πρόσκλησης'
		};
	}

	// Send email via Resend
	const emailResult = await sendTrainerInvitation({
		recipientEmail: email,
		inviterName: profile.full_name || profile.username || 'Admin',
		inviteToken: token,
		expiresAt
	});

	if (!emailResult.success) {
		console.error('[inviteTrainer] Email send failed:', emailResult.message);
		// Invitation is created but email failed — don't rollback, let them resend
	}

	return {
		success: true,
		emailSent: emailResult.success,
		invitation: {
			id: invitation.id,
			email: invitation.email,
			token: invitation.token,
			expiresAt: invitation.expires_at
		}
	};
});

/**
 * Resend a trainer invitation
 */
const resendInvitationSchema = z.object({
	invitationId: z.number().int().positive()
});

export const resendTrainerInvitation = command(resendInvitationSchema, async ({ invitationId }) => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([1]);

	// Get existing invitation
	const { data: invitation, error: fetchError } = await supabase
		.from('trainer_invitations')
		.select('id, email, status')
		.eq('id', invitationId)
		.single();

	if (fetchError || !invitation) {
		throw error(404, 'Invitation not found');
	}

	if (invitation.status !== 'pending') {
		throw error(400, `Cannot resend invitation with status: ${invitation.status}`);
	}

	// Generate new token and extend expiry
	const newToken = crypto.randomBytes(32).toString('hex');
	const newExpiry = new Date();
	newExpiry.setDate(newExpiry.getDate() + 7);

	const { error: updateError } = await supabase
		.from('trainer_invitations')
		.update({
			token: newToken,
			expires_at: newExpiry.toISOString(),
			updated_at: new Date().toISOString()
		})
		.eq('id', invitationId);

	if (updateError) {
		console.error('[resendTrainerInvitation] Update error:', updateError);
		throw error(500, 'Failed to update invitation');
	}

	// Resend email via Resend
	const emailResult = await sendTrainerInvitation({
		recipientEmail: invitation.email,
		inviterName: profile.full_name || profile.username || 'Admin',
		inviteToken: newToken,
		expiresAt: newExpiry
	});

	if (!emailResult.success) {
		console.error('[resendTrainerInvitation] Email resend failed:', emailResult.message);
	}

	return {
		success: true,
		emailSent: emailResult.success,
		newToken,
		email: invitation.email
	};
});

/**
 * Cancel a trainer invitation
 */
const cancelInvitationSchema = z.object({
	invitationId: z.number().int().positive()
});

export const cancelTrainerInvitation = command(cancelInvitationSchema, async ({ invitationId }) => {
	const supabase = createServerClient();

	const { error: updateError } = await supabase
		.from('trainer_invitations')
		.update({
			status: 'cancelled',
			updated_at: new Date().toISOString()
		})
		.eq('id', invitationId)
		.eq('status', 'pending');

	if (updateError) {
		console.error('[cancelTrainerInvitation] Error:', updateError);
		throw error(500, 'Failed to cancel invitation');
	}

	return { success: true };
});

// ============================================================
// STATS - Dashboard summary
// ============================================================

/**
 * Get trainer management dashboard stats
 */
export const getTrainerManagementStats = query(async () => {
	const supabase = createServerClient();
	// Total trainers
	const { count: trainerCount } = await supabase
		.from('profiles')
		.select('id', { count: 'exact', head: true })
		.eq('role_id', 3);

	// Active assignments
	const { count: activeAssignments } = await supabase
		.from('trainer_org_assigments')
		.select('id', { count: 'exact', head: true })
		.eq('is_active', true);

	// Total evaluations
	const { count: totalEvaluations } = await supabase
		.from('store_evaluations')
		.select('id', { count: 'exact', head: true });

	// Pending invitations
	const { count: pendingInvitations } = await supabase
		.from('trainer_invitations')
		.select('id', { count: 'exact', head: true })
		.eq('status', 'pending');

	return {
		trainerCount: trainerCount ?? 0,
		activeAssignments: activeAssignments ?? 0,
		totalEvaluations: totalEvaluations ?? 0,
		pendingInvitations: pendingInvitations ?? 0
	};
});

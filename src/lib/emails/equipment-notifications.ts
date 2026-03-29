// src/lib/email/equipment-notifications.ts
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { createServerClient, createAdminClient } from '$lib/supabase/server';
import type { Equipment } from '$lib/models/equipment.types';
import type { Profile } from '$lib/models/database.types';

const resend = new Resend(RESEND_API_KEY);

interface MaintenanceNotificationParams {
	equipment: Equipment;
	issueDescription: string;
	actionTaken: string;
	reportedBy: Profile;
	equipmentPageUrl: string;
	orgName?: string;
	orgLocation?: string | null;
}

/**
 * Fetch all users with the same organization and role_id 1, 2, 4 (admin, manager, head_barista)
 * AND all trainers assigned to this organization
 */
async function getNotificationRecipients(org_id: number): Promise<Profile[]> {
	const supabase = createServerClient();
	try {
		// Fetch org staff (admins, managers, head baristas)
		const { data: orgStaff, error: staffError } = await supabase
			.from('profiles')
			.select('*')
			.eq('org_id', org_id)
			.in('role_id', [1, 2, 4]);

		if (staffError) {
			console.error('[getNotificationRecipients] Error fetching staff recipients:', staffError);
			return [];
		}

		// Fetch trainers
		const { data: trainerProfiles, error: trainerError } = await supabase
			.from('profiles')
			.select('*')
			.eq('role_id', 3);

		if (trainerError) {
			console.error('[getNotificationRecipients] Error fetching trainer recipients:', trainerError);
			// Still return org staff even if trainer query fails
			return orgStaff || [];
		}

		// Combine and deduplicate by id
		const allRecipients = [...(orgStaff || []), ...trainerProfiles];
		const uniqueRecipients = allRecipients.filter(
			(profile, index, self) => self.findIndex((p) => p.id === profile.id) === index
		);

		return uniqueRecipients;
	} catch (error) {
		console.error('[getNotificationRecipients] Unexpected error:', error);
		return [];
	}
}

/**
 * Generate HTML email template for maintenance notification
 */
function generateMaintenanceEmailTemplate(params: MaintenanceNotificationParams): string {
	const {
		equipment,
		issueDescription,
		actionTaken,
		reportedBy,
		equipmentPageUrl,
		orgName,
		orgLocation
	} = params;

	// Status labels in Greek
	const statusLabels = {
		operational: 'Σε λειτουργία',
		maintenance: 'Σε service',
		broken: 'Βλάβη'
	};

	const statusLabel = statusLabels[equipment.status] || statusLabels.operational;

	return `
		<!DOCTYPE html>
		<html lang="el">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Ειδοποίηση Συντήρησης Εξοπλισμού</title>
		</head>
		<body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
				<tr>
					<td style="padding: 40px 20px;">
						<table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5;">
							
							<!-- Header -->
							<tr>
								<td style="padding: 32px 40px; border-bottom: 1px solid #e5e5e5;">
									<h1 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">
										Ειδοποίηση Συντήρησης Εξοπλισμού
									</h1>
									<p style="margin: 0; color: #737373; font-size: 14px;">
										TailorMade Equipment Management
									</p>
								</td>
							</tr>

							<!-- Content -->
							<tr>
								<td style="padding: 40px;">

									<!-- Organization Info -->
									${
										orgName
											? `
									<div style="margin-bottom: 24px; padding: 16px; background-color: #f8f5f0; border-radius: 4px; border-left: 3px solid #D4A574;">
										<p style="margin: 0 0 4px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
											${orgName}
										</p>
										${
											orgLocation
												? `
										<p style="margin: 0; color: #737373; font-size: 13px;">
											📍 ${orgLocation}
										</p>
										`
												: ''
										}
									</div>
									`
											: ''
									}

									<!-- Equipment Details -->
									<div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #f0f0f0;">
										<table role="presentation" style="width: 100%; border-collapse: collapse;">
											<tr>
												<td style="padding-bottom: 4px;">
													<h2 style="margin: 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">
														${equipment.name}
													</h2>
												</td>
												<td style="text-align: right; padding-bottom: 4px;">
													<span style="display: inline-block; padding: 4px 12px; background-color: #f5f5f5; color: #525252; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 3px;">
														${statusLabel}
													</span>
												</td>
											</tr>
										</table>
										
										<table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 12px;">
											<tr>
												<td style="padding: 4px 0; color: #737373; font-size: 13px;">
													<strong style="color: #525252;">ID:</strong> #${equipment.id.toString().padStart(4, '0')}
												</td>
											</tr>
											${
												equipment.model
													? `
											<tr>
												<td style="padding: 4px 0; color: #737373; font-size: 13px;">
													<strong style="color: #525252;">Μοντέλο:</strong> ${equipment.model}
												</td>
											</tr>
											`
													: ''
											}
											${
												equipment.next_service_date
													? `
											<tr>
												<td style="padding: 4px 0; color: #737373; font-size: 13px;">
													<strong style="color: #525252;">Επόμενο Service:</strong> ${new Date(equipment.next_service_date).toLocaleDateString('el-GR')}
												</td>
											</tr>
											`
													: ''
											}
										</table>
									</div>

									<!-- Issue Description -->
									<div style="margin-bottom: 24px;">
										<h3 style="margin: 0 0 12px 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">
											Περιγραφή Προβλήματος
										</h3>
										<div style="padding: 16px; background-color: #fafafa; border-left: 3px solid #D4A574; color: #1a1a1a; font-size: 14px; line-height: 1.6;">
											${issueDescription}
										</div>
									</div>

									<!-- Action Taken -->
									<div style="margin-bottom: 32px;">
										<h3 style="margin: 0 0 12px 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">
											Ενέργεια που Πραγματοποιήθηκε
										</h3>
										<div style="padding: 16px; background-color: #fafafa; border-left: 3px solid #8B6B4A; color: #1a1a1a; font-size: 14px; line-height: 1.6;">
											${actionTaken}
										</div>
									</div>

									<!-- Reported By -->
									<div style="padding: 16px; background-color: #fafafa; margin-bottom: 32px; border-radius: 4px;">
										<p style="margin: 0 0 4px 0; color: #525252; font-size: 13px;">
											<strong>Αναφορά από:</strong> ${reportedBy.username}, ${reportedBy.phone || reportedBy.email}
										</p>
										<p style="margin: 0; color: #737373; font-size: 12px;">
											${new Date().toLocaleString('el-GR', {
												dateStyle: 'long',
												timeStyle: 'short'
											})}
										</p>
									</div>

									<!-- CTA Button -->
									<div style="text-align: center;">
										<a href="${equipmentPageUrl}" 
											 style="display: inline-block; background-color: #D4A574; color: #ffffff; text-decoration: none; padding: 12px 32px; font-weight: 500; font-size: 14px; border-radius: 4px; letter-spacing: 0.3px;">
											Προβολή Εξοπλισμού
										</a>
									</div>
								</td>
							</tr>

							<!-- Footer -->
							<tr>
								<td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
									<p style="margin: 0; color: #737373; font-size: 12px; text-align: center; line-height: 1.5;">
										Αυτόματη ειδοποίηση από το σύστημα διαχείρισης εξοπλισμού TailorMade.<br>
										Παρακαλώ μην απαντήσετε σε αυτό το email.
									</p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
		</html>
	`;
}
/**
 * Send maintance notification to eligible users
 */
export async function sendMaintanceNotification(
	params: MaintenanceNotificationParams
): Promise<{ success: boolean; message: string; sentCount: number }> {
	try {
		const { equipment, reportedBy } = params;

		const recipients = await getNotificationRecipients(reportedBy.org_id);

		if (recipients.length === 0) {
			console.warn(
				'[sendMaintenanceNotification] No recipients found for org_id:',
				reportedBy.org_id
			);
			return {
				success: true,
				message: 'No eligible recipients found',
				sentCount: 0
			};
		}

		// Fetch organization info for the email
		const supabase = createServerClient();
		const { data: org } = await supabase
			.from('core_organizations')
			.select('store_name, location')
			.eq('id', reportedBy.org_id)
			.single();

		// Generate email HTML with org info
		const emailHtml = generateMaintenanceEmailTemplate({
			...params,
			orgName: org?.store_name,
			orgLocation: org?.location
		});

		// Prepare recipient emails
		const recipientEmails = recipients
			.map((r) => r.email)
			.filter((email): email is string => !!email);

		if (recipientEmails.length === 0) {
			console.error('[sendMaintenanceNotification] No valid email addresses found');
			return {
				success: false,
				message: 'No valid email addresses for recipients',
				sentCount: 0
			};
		}

		// Send emails
		const { data, error } = await resend.emails.send({
			from: 'TailorMade <team@tailormadebov2.app>',
			to: recipientEmails,
			subject: `⚠️ Ειδοποίηση συντήρησης: ${equipment.name} - Απαιτείται ενέργεια`,
			html: emailHtml
		});

		if (error) {
			console.error('[sendMaintenanceNotification] Resend error:', error);
			return {
				success: false,
				message: `Failed to send notification: ${error.message}`,
				sentCount: 0
			};
		}

		console.log(
			'[sendMaintenanceNotification] Successfully sent emails to:',
			recipientEmails.length,
			'recipients'
		);
		return {
			success: true,
			message: `Ειδοποίηση που αποστέλλεται σε ${recipientEmails.length} παραλήπτες`,
			sentCount: recipientEmails.length
		};
	} catch (error) {
		console.error('[sendMaintenanceNotification] Unexpected error:', error);
		return {
			success: false,
			message: 'Failed to send maintenance notification',
			sentCount: 0
		};
	}
}

// ============================================================
// VISIT COMPLETION NOTIFICATION (to super admins)
// ============================================================

interface VisitCompletionAction {
	action_type: string;
	description: string;
	cost: number;
	equipment: { name: string; model: string | null } | null;
}

interface VisitCompletionNotificationParams {
	visitId: number;
	orgName: string;
	orgLocation: string | null;
	trainerName: string;
	visitDate: string;
	completedAt: string;
	notes: string | null;
	actions: VisitCompletionAction[];
	totalCost: number;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
	inspected: 'Επιθεώρηση',
	cleaned_maintained: 'Καθαρισμός / Συντήρηση',
	repaired_on_site: 'Επισκευή επί τόπου',
	took_for_service: 'Παραλαβή για service',
	returned_from_service: 'Επιστροφή από service',
	replaced_part: 'Αντικατάσταση εξαρτήματος',
	marked_as_broken: 'Σήμανση ως βλάβη'
};

/**
 * Fetch all super admin profiles (role_id 1)
 */
async function getSuperAdminRecipients(): Promise<Profile[]> {
	const supabase = createAdminClient();
	try {
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('role_id', 1);

		if (error) {
			console.error('[getSuperAdminRecipients] Error:', error);
			return [];
		}
		return data || [];
	} catch (error) {
		console.error('[getSuperAdminRecipients] Unexpected error:', error);
		return [];
	}
}

/**
 * Generate HTML email for visit completion notification
 */
function generateVisitCompletionEmailTemplate(params: VisitCompletionNotificationParams): string {
	const {
		visitId,
		orgName,
		orgLocation,
		trainerName,
		visitDate,
		completedAt,
		notes,
		actions,
		totalCost
	} = params;

	const formattedVisitDate = new Date(visitDate).toLocaleDateString('el-GR', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	const formattedCompletedAt = new Date(completedAt).toLocaleString('el-GR', {
		dateStyle: 'long',
		timeStyle: 'short'
	});

	// Group actions by equipment
	const groupedByEquipment = actions.reduce(
		(acc, action) => {
			const eqName = action.equipment?.name || 'Άγνωστο';
			if (!acc[eqName]) acc[eqName] = [];
			acc[eqName].push(action);
			return acc;
		},
		{} as Record<string, VisitCompletionAction[]>
	);

	// Build actions HTML grouped by equipment
	const actionsHtml = Object.entries(groupedByEquipment)
		.map(
			([equipName, eqActions]) => `
			<div style="margin-bottom: 20px;">
				<h4 style="margin: 0 0 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 600;">
					🔧 ${equipName}
				</h4>
				${eqActions
					.map(
						(a) => `
				<div style="padding: 10px 14px; margin-bottom: 6px; background-color: #fafafa; border-left: 3px solid #D4A574; font-size: 13px;">
					<div style="color: #525252; font-weight: 500; margin-bottom: 4px;">
						${ACTION_TYPE_LABELS[a.action_type] || a.action_type}
						${a.cost > 0 ? `<span style="float: right; color: #8B6B4A; font-weight: 600;">${a.cost.toFixed(2)}€</span>` : ''}
					</div>
					<div style="color: #737373; line-height: 1.5;">${a.description}</div>
				</div>
				`
					)
					.join('')}
			</div>
		`
		)
		.join('');

	return `
		<!DOCTYPE html>
		<html lang="el">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Ολοκλήρωση Επίσκεψης Εξοπλισμού</title>
		</head>
		<body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
				<tr>
					<td style="padding: 40px 20px;">
						<table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5;">

							<!-- Header -->
							<tr>
								<td style="padding: 32px 40px; border-bottom: 1px solid #e5e5e5;">
									<h1 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">
										✅ Ολοκλήρωση Επίσκεψης Εξοπλισμού
									</h1>
									<p style="margin: 0; color: #737373; font-size: 14px;">
										TailorMade Equipment Management
									</p>
								</td>
							</tr>

							<!-- Content -->
							<tr>
								<td style="padding: 40px;">

									<!-- Visit Summary -->
									<div style="margin-bottom: 24px; padding: 16px; background-color: #f8f5f0; border-radius: 4px; border-left: 3px solid #D4A574;">
										<p style="margin: 0 0 4px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
											${orgName}
										</p>
										${orgLocation ? `<p style="margin: 0 0 8px 0; color: #737373; font-size: 13px;">📍 ${orgLocation}</p>` : ''}
										<table role="presentation" style="width: 100%; border-collapse: collapse;">
											<tr>
												<td style="padding: 4px 0; color: #737373; font-size: 13px;">
													<strong style="color: #525252;">Trainer:</strong> ${trainerName}
												</td>
											</tr>
											<tr>
												<td style="padding: 4px 0; color: #737373; font-size: 13px;">
													<strong style="color: #525252;">Ημ/νία Επίσκεψης:</strong> ${formattedVisitDate}
												</td>
											</tr>
											<tr>
												<td style="padding: 4px 0; color: #737373; font-size: 13px;">
													<strong style="color: #525252;">Ολοκληρώθηκε:</strong> ${formattedCompletedAt}
												</td>
											</tr>
											<tr>
												<td style="padding: 4px 0; color: #737373; font-size: 13px;">
													<strong style="color: #525252;">Ενέργειες:</strong> ${actions.length}
													${totalCost > 0 ? ` &nbsp;|&nbsp; <strong style="color: #525252;">Κόστος:</strong> ${totalCost.toFixed(2)}€` : ''}
												</td>
											</tr>
										</table>
									</div>

									<!-- Actions by Equipment -->
									<div style="margin-bottom: 24px;">
										<h3 style="margin: 0 0 16px 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">
											Ενέργειες ανά Εξοπλισμό
										</h3>
										${actions.length > 0 ? actionsHtml : '<p style="color: #737373; font-size: 14px;">Δεν καταγράφηκαν ενέργειες.</p>'}
									</div>

									<!-- Notes -->
									${
										notes
											? `
									<div style="margin-bottom: 32px;">
										<h3 style="margin: 0 0 12px 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">
											Σημειώσεις
										</h3>
										<div style="padding: 16px; background-color: #fafafa; border-left: 3px solid #8B6B4A; color: #1a1a1a; font-size: 14px; line-height: 1.6;">
											${notes}
										</div>
									</div>
									`
											: ''
									}

									<!-- CTA Button -->
									<div style="text-align: center;">
										<a href="https://tailormadebov2.app/app/managment/trainers/visit/${visitId}"
											 style="display: inline-block; background-color: #D4A574; color: #ffffff; text-decoration: none; padding: 12px 32px; font-weight: 500; font-size: 14px; border-radius: 4px; letter-spacing: 0.3px;">
											Προβολή Επίσκεψης
										</a>
									</div>
								</td>
							</tr>

							<!-- Footer -->
							<tr>
								<td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
									<p style="margin: 0; color: #737373; font-size: 12px; text-align: center; line-height: 1.5;">
										Αυτόματη ειδοποίηση από το σύστημα διαχείρισης εξοπλισμού TailorMade.<br>
										Παρακαλώ μην απαντήσετε σε αυτό το email.
									</p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
		</html>
	`;
}

/**
 * Send visit completion email to all super admins (role_id 1)
 */
export async function sendVisitCompletionNotification(
	visitId: number,
	trainerId: string
): Promise<{ success: boolean; message: string; sentCount: number }> {
	try {
		const supabase = createAdminClient();

		// Fetch the completed visit with actions and org info
		const { data: visit, error: visitError } = await supabase
			.from('trainer_service_visits')
			.select(
				`*,
				core_organizations (id, store_name, location),
				trainer_visit_actions (
					action_type, description, cost,
					equipment (name, model)
				)`
			)
			.eq('id', visitId)
			.single();

		if (visitError || !visit) {
			console.error('[sendVisitCompletionNotification] Visit fetch error:', visitError);
			return { success: false, message: 'Failed to fetch visit data', sentCount: 0 };
		}

		// Fetch trainer profile
		const { data: trainer } = await supabase
			.from('profiles')
			.select('username')
			.eq('id', trainerId)
			.single();

		// Get super admin recipients
		const recipients = await getSuperAdminRecipients();
		const recipientEmails = recipients
			.map((r) => r.email)
			.filter((email): email is string => !!email);

		if (recipientEmails.length === 0) {
			console.warn('[sendVisitCompletionNotification] No super admin recipients found');
			return { success: true, message: 'No super admin recipients found', sentCount: 0 };
		}

		const actions = (visit as any).trainer_visit_actions || [];
		const totalCost = actions.reduce((sum: number, a: any) => sum + (a.cost || 0), 0);
		const org = (visit as any).core_organizations;

		const emailHtml = generateVisitCompletionEmailTemplate({
			visitId,
			orgName: org?.store_name || 'Άγνωστο κατάστημα',
			orgLocation: org?.location || null,
			trainerName: trainer?.username || 'Trainer',
			visitDate: visit.visit_date,
			completedAt: visit.completed_at || new Date().toISOString(),
			notes: visit.notes,
			actions: actions.map((a: any) => ({
				action_type: a.action_type,
				description: a.description,
				cost: a.cost || 0,
				equipment: a.equipment
			})),
			totalCost
		});

		const { error } = await resend.emails.send({
			from: 'TailorMade <team@tailormadebov2.app>',
			to: recipientEmails,
			subject: `✅ Ολοκλήρωση επίσκεψης: ${org?.store_name || 'Κατάστημα'} — ${trainer?.username || 'Trainer'}`,
			html: emailHtml
		});

		if (error) {
			console.error('[sendVisitCompletionNotification] Resend error:', error);
			return { success: false, message: `Failed to send: ${error.message}`, sentCount: 0 };
		}

		console.log(
			'[sendVisitCompletionNotification] Sent to',
			recipientEmails.length,
			'super admins'
		);
		return {
			success: true,
			message: `Ειδοποίηση σε ${recipientEmails.length} διαχειριστές`,
			sentCount: recipientEmails.length
		};
	} catch (error) {
		console.error('[sendVisitCompletionNotification] Unexpected error:', error);
		return { success: false, message: 'Failed to send visit completion notification', sentCount: 0 };
	}
}

// ============================================================
// ISSUE RESOLVED NOTIFICATION (to org admins/managers)
// ============================================================

/**
 * Send a simple email to org admins when a trainer resolves maintenance issues
 */
export async function sendIssueResolvedNotification(
	logIds: number[],
	orgId: number,
	trainerId: string
): Promise<void> {
	try {
		const supabase = createAdminClient();

		// Fetch resolved logs with equipment info
		const { data: logs } = await supabase
			.from('maintenance_logs')
			.select(
				`id, issue_description, title,
				equipment!maintenance_logs_equipment_id_fkey (name, model)`
			)
			.in('id', logIds);

		// Fetch org info
		const { data: org } = await supabase
			.from('core_organizations')
			.select('store_name, location')
			.eq('id', orgId)
			.single();

		// Fetch trainer name
		const { data: trainer } = await supabase
			.from('profiles')
			.select('username')
			.eq('id', trainerId)
			.single();

		// Fetch org admins + managers (role_id 1, 2)
		const { data: recipients } = await supabase
			.from('profiles')
			.select('email')
			.eq('org_id', orgId)
			.in('role_id', [1, 2]);

		const emails = (recipients || [])
			.map((r) => r.email)
			.filter((e): e is string => !!e);

		if (emails.length === 0) return;

		const issuesList = (logs || [])
			.map((log: any) => {
				const eqName = log.equipment?.name || 'Άγνωστο';
				const desc = log.issue_description || log.title || '—';
				return `<li style="margin-bottom: 8px; font-size: 14px; color: #1a1a1a;">
					<strong>${eqName}</strong> — ${desc}
				</li>`;
			})
			.join('');

		const html = `
			<!DOCTYPE html>
			<html lang="el">
			<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
			<body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; background-color: #f5f5f5;">
				<table role="presentation" style="width: 100%; background-color: #f5f5f5;">
					<tr><td style="padding: 40px 20px;">
						<table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5;">
							<tr>
								<td style="padding: 32px 40px; border-bottom: 1px solid #e5e5e5;">
									<h1 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">
										Επίλυση Βλαβών Εξοπλισμού
									</h1>
									<p style="margin: 0; color: #737373; font-size: 14px;">TailorMade Equipment Management</p>
								</td>
							</tr>
							<tr>
								<td style="padding: 40px;">
									<div style="margin-bottom: 24px; padding: 16px; background-color: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 4px;">
										<p style="margin: 0 0 4px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
											${org?.store_name || 'Κατάστημα'}
										</p>
										${org?.location ? `<p style="margin: 0; color: #737373; font-size: 13px;">${org.location}</p>` : ''}
									</div>
									<p style="color: #525252; font-size: 14px; margin-bottom: 8px;">
										Ο trainer <strong>${trainer?.username || 'Trainer'}</strong> επέλυσε ${logIds.length === 1 ? 'την παρακάτω βλάβη' : `${logIds.length} βλάβες`}:
									</p>
									<ul style="padding-left: 20px; margin: 16px 0 24px;">
										${issuesList}
									</ul>
									<p style="color: #737373; font-size: 12px;">
										${new Date().toLocaleString('el-GR', { dateStyle: 'long', timeStyle: 'short' })}
									</p>
								</td>
							</tr>
							<tr>
								<td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
									<p style="margin: 0; color: #737373; font-size: 12px; text-align: center;">
										Αυτόματη ειδοποίηση από το TailorMade. Παρακαλώ μην απαντήσετε.
									</p>
								</td>
							</tr>
						</table>
					</td></tr>
				</table>
			</body>
			</html>
		`;

		await resend.emails.send({
			from: 'TailorMade <team@tailormadebov2.app>',
			to: emails,
			subject: `Επίλυση βλαβών: ${org?.store_name || 'Κατάστημα'} — ${trainer?.username || 'Trainer'}`,
			html
		});

		console.log('[sendIssueResolvedNotification] Sent to', emails.length, 'recipients');
	} catch (error) {
		console.error('[sendIssueResolvedNotification] Error:', error);
	}
}

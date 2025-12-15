// src/lib/email/equipment-notifications.ts
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { createServerClient } from '$lib/supabase/server';
import type { Equipment } from '$lib/models/equipment.types';
import type { Profile } from '$lib/models/database.types';

const resend = new Resend(RESEND_API_KEY);

interface MaintenanceNotificationParams {
	equipment: Equipment;
	issueDescription: string;
	actionTaken: string;
	reportedBy: Profile;
	equipmentPageUrl: string;
}

/**
 * Fetch all users with the same organization and role_id 2 and 4 (admin and head_barista)
 */
async function getNotificationRecipients(org_id: number): Promise<Profile[]> {
	const supabase = createServerClient();
	try {
		const { data: profiles, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('org_id', org_id)
			.in('role_id', [2, 4]);

		if (error) {
			console.error('[getNotificationRecipients] Error fetching recipients:', error);
			return [];
		}

		return profiles || [];
	} catch (error) {
		console.error('[getNotificationRecipients] Unexpected error:', error);
		return [];
	}
}

/**
 * Generate HTML email template for maintenance notification
 */
function generateMaintenanceEmailTemplate(params: MaintenanceNotificationParams): string {
	const { equipment, issueDescription, actionTaken, reportedBy, equipmentPageUrl } = params;

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

		/*//filter out the reporter if it recipient
		const filteredRecipients = recipients.filter((r) => r.id !== reportedBy.id);

		if (filteredRecipients.length === 0) {
			console.warn('[sendMaintenanceNotification] No recipients after filtering reporter');
			return {
				success: true,
				message: 'No additional recipients to notify',
				sentCount: 0
			};
		}*/

		// Generate email HTML
		const emailHtml = generateMaintenanceEmailTemplate(params);

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

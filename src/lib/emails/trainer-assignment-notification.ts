// src/lib/emails/trainer-assignment-notification.ts
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { dev } from '$app/environment';

const PUBLIC_APP_URL = dev ? 'http://localhost:5173' : 'https://tailormadebov2.app';

const resend = new Resend(RESEND_API_KEY);

interface AssignmentNotificationParams {
	recipientEmail: string;
	trainerName: string;
	assignedBy: string;
	visitDate: string; // ISO date
	organizations: { id: number; store_name: string; location?: string }[];
}

/**
 * Generate HTML email template for trainer assignment notification
 */
function generateAssignmentEmailTemplate(params: AssignmentNotificationParams): string {
	const { trainerName, assignedBy, visitDate, organizations } = params;

	const dashboardUrl = `${PUBLIC_APP_URL}/app/trainer`;
	const logoUrl = `${PUBLIC_APP_URL}/tailor_venetis.png`;

	const formattedDate = new Date(visitDate).toLocaleDateString('el-GR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	// Build store list rows
	const storeRows = organizations
		.map(
			(org, i) => `
			<tr>
				<td style="padding: 12px 16px; border-bottom: 1px solid #F0EBE5; vertical-align: top;">
					<table role="presentation" style="width: 100%; border-collapse: collapse;">
						<tr>
							<td style="width: 28px; vertical-align: top; padding-top: 2px;">
								<div style="width: 24px; height: 24px; background-color: #F9F6F2; border: 1px solid #E0D6CC; border-radius: 50%; text-align: center; line-height: 24px; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11px; color: #6B5344; font-weight: 600;">
									${i + 1}
								</div>
							</td>
							<td style="padding-left: 12px;">
								<p style="margin: 0; color: #3D3428; font-size: 14px; font-weight: 600; font-family: 'Segoe UI', system-ui, sans-serif;">
									${org.store_name}
								</p>
								${
									org.location
										? `<p style="margin: 4px 0 0; color: #A99888; font-size: 12px; font-family: 'Segoe UI', system-ui, sans-serif;">
											📍 ${org.location}
										</p>`
										: ''
								}
							</td>
						</tr>
					</table>
				</td>
			</tr>`
		)
		.join('');

	return `
		<!DOCTYPE html>
		<html lang="el">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Νέα Ανάθεση Αξιολόγησης</title>
		</head>
		<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #F7F4F0; line-height: 1.7;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F7F4F0;">
				<tr>
					<td style="padding: 60px 20px;">
						<table role="presentation" style="max-width: 460px; margin: 0 auto; background-color: #FFFEFA; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 4px rgba(80, 60, 40, 0.06);">
							
							<!-- Header -->
							<tr>
								<td style="padding: 48px 48px 0; text-align: center;">
									<img src="${logoUrl}" alt="Tailor Made" style="width: 100%; height: auto; display: block;" />
								</td>
							</tr>

							<!-- Divider -->
							<tr>
								<td style="padding: 32px 48px;">
									<div style="height: 1px; background: linear-gradient(to right, transparent, #E0D6CC, transparent);"></div>
								</td>
							</tr>

							<!-- Content -->
							<tr>
								<td style="padding: 0 48px 48px;">
									
									<!-- Greeting -->
									<p style="margin: 0 0 24px; color: #3D3428; font-size: 15px; text-align: center; line-height: 1.8;">
										Αγαπητέ/ή <strong>${trainerName}</strong>
									</p>
									
									<!-- Notification -->
									<p style="margin: 0 0 32px; color: #3D3428; font-size: 15px; text-align: center; line-height: 1.8;">
										Ο/Η <strong>${assignedBy}</strong> σας ανέθεσε<br />
										${organizations.length === 1 ? 'μία νέα αξιολόγηση' : `<strong>${organizations.length}</strong> νέες αξιολογήσεις`}
									</p>

									<!-- Visit Date Box -->
									<div style="margin: 0 0 28px; padding: 20px; background-color: #F9F6F2; border-radius: 4px; border-left: 3px solid #6B5344;">
										<p style="margin: 0; color: #8C7B6B; font-size: 11px; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
											Ημερομηνία Επίσκεψης
										</p>
										<p style="margin: 0; color: #3D3428; font-size: 16px; text-align: center; font-weight: bold; font-family: 'Segoe UI', system-ui, sans-serif;">
											📅 ${formattedDate}
										</p>
									</div>

									<!-- Stores List -->
									<div style="margin: 0 0 32px;">
										<p style="margin: 0 0 12px; color: #8C7B6B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
											${organizations.length === 1 ? 'Κατάστημα' : 'Καταστήματα'}
										</p>
										<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFFEFA; border: 1px solid #F0EBE5; border-radius: 4px; overflow: hidden;">
											${storeRows}
										</table>
									</div>

									<!-- CTA Button -->
									<div style="text-align: center; margin-bottom: 36px;">
										<a href="${dashboardUrl}" 
											style="display: inline-block; background-color: #6B5344; color: #FFFEFA; text-decoration: none; padding: 12px 32px; font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 500; font-size: 13px; border-radius: 4px; letter-spacing: 0.5px;">
											Προβολή Αναθέσεων
										</a>
									</div>

									<!-- Closing -->
									<p style="margin: 0; color: #A99888; font-size: 13px; text-align: center; font-style: italic;">
										Καλή αξιολόγηση!
									</p>
								</td>
							</tr>

							<!-- Footer -->
							<tr>
								<td style="padding: 24px 48px; background-color: #F9F6F2;">
									<p style="margin: 0 0 8px; color: #B5A898; font-size: 11px; text-align: center;">
										Ανατέθηκε: ${new Date().toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}
									</p>
									<p style="margin: 0; color: #C8BDB0; font-size: 10px; text-align: center;">
										Αν έχετε ερωτήσεις, επικοινωνήστε με τον διαχειριστή.
									</p>
								</td>
							</tr>
						</table>

						<!-- Link fallback -->
						<table role="presentation" style="max-width: 460px; margin: 24px auto 0;">
							<tr>
								<td style="text-align: center;">
									<p style="margin: 0; color: #C8BDB0; font-size: 10px; font-family: 'Segoe UI', system-ui, sans-serif;">
										${dashboardUrl}
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
 * Send assignment notification email to trainer
 */
export async function sendTrainerAssignmentNotification(
	params: AssignmentNotificationParams
): Promise<{ success: boolean; message: string; emailId?: string }> {
	try {
		const { recipientEmail, trainerName, organizations } = params;

		const emailHtml = generateAssignmentEmailTemplate(params);

		const storeNames = organizations.map((o) => o.store_name).join(', ');
		const subject =
			organizations.length === 1
				? `📋 Νέα ανάθεση αξιολόγησης: ${storeNames}`
				: `📋 ${organizations.length} νέες αναθέσεις αξιολόγησης`;

		const { data, error } = await resend.emails.send({
			from: 'TailorMade <team@tailormadebov2.app>',
			to: recipientEmail,
			subject,
			html: emailHtml
		});

		if (error) {
			console.error('[sendTrainerAssignmentNotification] Resend error:', error);
			return {
				success: false,
				message: `Failed to send notification: ${error.message}`
			};
		}

		console.log(
			'[sendTrainerAssignmentNotification] Email sent to:',
			recipientEmail,
			'for',
			organizations.length,
			'stores'
		);
		return {
			success: true,
			message: `Ειδοποίηση στάλθηκε στο ${recipientEmail}`,
			emailId: data?.id
		};
	} catch (error) {
		console.error('[sendTrainerAssignmentNotification] Unexpected error:', error);
		return {
			success: false,
			message: 'Failed to send assignment notification'
		};
	}
}
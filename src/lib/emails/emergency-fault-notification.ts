import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { createServerClient } from '$lib/supabase/server';
import type { Profile } from '$lib/models/database.types';

const resend = new Resend(RESEND_API_KEY);

export interface EmergencyFaultNotificationParams {
	orgId: number;
	orgName: string;
	reporterName: string;
	reporterPhone: string;
	title: string;
	issueDescription: string;
	images: string[];
	reportedAt: Date;
}

async function getNotificationRecipients(org_id: number): Promise<Profile[]> {
	const supabase = createServerClient();
	try {
		const { data: profiles, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('org_id', org_id)
			.eq('role_id', 3);

		if (error) {
			console.error('[getEmergencyRecipients] Error fetching recipients:', error);
			return [];
		}

		return profiles || [];
	} catch (error) {
		console.error('[getEmergencyRecipients] Unexpected error:', error);
		return [];
	}
}

function generateEmergencyFaultEmailTemplate(params: EmergencyFaultNotificationParams): string {
	const { orgName, reporterName, reporterPhone, title, issueDescription, reportedAt } = params;

	return `
		<!DOCTYPE html>
		<html lang="el">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Εκτακτη Βλάβη</title>
		</head>
		<body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
				<tr>
					<td style="padding: 40px 20px;">
						<table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5;">

							<!-- Header -->
							<tr>
								<td style="padding: 32px 40px; border-bottom: 3px solid #ef4444;">
									<h1 style="margin: 0 0 8px 0; color: #ef4444; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">
										⚠️ Εκτακτη Βλάβη
									</h1>
									<p style="margin: 0; color: #737373; font-size: 14px;">
										TailorMade Equipment Management — ${orgName}
									</p>
								</td>
							</tr>

							<!-- Content -->
							<tr>
								<td style="padding: 40px;">

									<!-- Title & Date -->
									<div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #f0f0f0;">
										<h2 style="margin: 0 0 8px 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">
											${title}
										</h2>
										<p style="margin: 0; color: #737373; font-size: 13px;">
											${reportedAt.toLocaleString('el-GR', { dateStyle: 'long', timeStyle: 'short' })}
										</p>
									</div>

									<!-- Issue Description -->
									<div style="margin-bottom: 32px;">
										<h3 style="margin: 0 0 12px 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">
											Περιγραφή Προβλήματος
										</h3>
										<div style="padding: 16px; background-color: #fafafa; border-left: 3px solid #ef4444; color: #1a1a1a; font-size: 14px; line-height: 1.6;">
											${issueDescription}
										</div>
									</div>

									<!-- Reporter -->
									<div style="padding: 16px; background-color: #fafafa; border-radius: 4px;">
										<p style="margin: 0 0 4px 0; color: #525252; font-size: 13px;">
											<strong>Αναφορά από:</strong> ${reporterName}${reporterPhone ? `, ${reporterPhone}` : ''}
										</p>
										<p style="margin: 0; color: #737373; font-size: 12px;">
											Κατάστημα: ${orgName}
										</p>
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

export async function sendEmergencyFaultNotification(
	params: EmergencyFaultNotificationParams
): Promise<{ success: boolean; message: string; sentCount: number }> {
	try {
		const { orgId, orgName, title } = params;

		const recipients = await getNotificationRecipients(orgId);

		if (recipients.length === 0) {
			console.warn('[sendEmergencyFaultNotification] No recipients found for org_id:', orgId);
			return { success: true, message: 'No eligible recipients found', sentCount: 0 };
		}

		const emailHtml = generateEmergencyFaultEmailTemplate(params);

		const recipientEmails = recipients
			.map((r) => r.email)
			.filter((email): email is string => !!email);

		if (recipientEmails.length === 0) {
			console.error('[sendEmergencyFaultNotification] No valid email addresses found');
			return {
				success: false,
				message: 'No valid email addresses for recipients',
				sentCount: 0
			};
		}

		const { error } = await resend.emails.send({
			from: 'TailorMade <team@tailormadebov2.app>',
			to: recipientEmails,
			subject: `⚠️ Εκτακτη Βλάβη: ${title} — ${orgName}`,
			html: emailHtml
		});

		if (error) {
			console.error('[sendEmergencyFaultNotification] Resend error:', error);
			return {
				success: false,
				message: `Failed to send notification: ${error.message}`,
				sentCount: 0
			};
		}

		console.log(
			'[sendEmergencyFaultNotification] Successfully sent emails to:',
			recipientEmails.length,
			'recipients'
		);
		return {
			success: true,
			message: `Ειδοποίηση που αποστέλλεται σε ${recipientEmails.length} παραλήπτες`,
			sentCount: recipientEmails.length
		};
	} catch (error) {
		console.error('[sendEmergencyFaultNotification] Unexpected error:', error);
		return {
			success: false,
			message: 'Failed to send emergency fault notification',
			sentCount: 0
		};
	}
}

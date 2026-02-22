// src/lib/emails/trainer-invitations.ts
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { dev } from '$app/environment';

const PUBLIC_APP_URL = dev ? 'http://localhost:5173' : 'https://tailormadebov2.app';

const resend = new Resend(RESEND_API_KEY);

interface TrainerInvitationEmailParams {
	recipientEmail: string;
	inviterName: string;
	inviteToken: string;
	expiresAt: Date;
}

/**
 * Generate HTML email template for trainer invitation
 */
function generateTrainerInvitationEmailTemplate(params: TrainerInvitationEmailParams): string {
	const { inviterName, inviteToken, expiresAt } = params;

	const acceptUrl = `${PUBLIC_APP_URL}/invite/accept?token=${inviteToken}&type=trainer`;
	const logoUrl = `${PUBLIC_APP_URL}/tailor_venetis.png`;

	const expirationFormatted = expiresAt.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>You're invited to join TailorMade as a Trainer</title>
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
									
									<!-- Welcome text -->
									<p style="margin: 0 0 24px; color: #3D3428; font-size: 15px; text-align: center; line-height: 1.8;">
										<strong>${inviterName}</strong> has invited you to join<br />
										the <strong>TailorMade</strong> platform
									</p>
									
									<!-- Role badge -->
									<div style="text-align: center; margin-bottom: 36px;">
										<span style="display: inline-block; padding: 6px 20px; background-color: #F9F6F2; border: 1px solid #E0D6CC; border-radius: 20px; color: #6B5344; font-size: 13px; font-style: italic; font-family: 'Segoe UI', system-ui, sans-serif; letter-spacing: 0.3px;">
											☕ as Trainer
										</span>
									</div>

									<!-- Description -->
									<p style="margin: 0 0 32px; color: #8C7B6B; font-size: 13px; text-align: center; line-height: 1.8;">
										As a trainer, you'll be able to visit stores,<br />
										conduct evaluations, and help teams improve<br />
										their coffee craft.
									</p>

									<!-- CTA Button -->
									<div style="text-align: center; margin-bottom: 36px;">
										<a href="${acceptUrl}" 
											style="display: inline-block; background-color: #6B5344; color: #FFFEFA; text-decoration: none; padding: 12px 32px; font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 500; font-size: 13px; border-radius: 4px; letter-spacing: 0.5px;">
											Accept Invitation
										</a>
									</div>

									<!-- Warm closing -->
									<p style="margin: 0; color: #A99888; font-size: 13px; text-align: center; font-style: italic;">
										We look forward to having you on board
									</p>
								</td>
							</tr>

							<!-- Footer -->
							<tr>
								<td style="padding: 24px 48px; background-color: #F9F6F2;">
									<p style="margin: 0 0 8px; color: #B5A898; font-size: 11px; text-align: center;">
										This invitation expires on ${expirationFormatted}
									</p>
									<p style="margin: 0; color: #C8BDB0; font-size: 10px; text-align: center;">
										If you don't recognize this invitation, you can safely ignore it.
									</p>
								</td>
							</tr>
						</table>

						<!-- Link fallback -->
						<table role="presentation" style="max-width: 460px; margin: 24px auto 0;">
							<tr>
								<td style="text-align: center;">
									<p style="margin: 0; color: #C8BDB0; font-size: 10px; font-family: 'Segoe UI', system-ui, sans-serif;">
										${acceptUrl}
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
 * Send trainer invitation email via Resend
 */
export async function sendTrainerInvitation(
	params: TrainerInvitationEmailParams
): Promise<{ success: boolean; message: string; emailId?: string }> {
	try {
		const { recipientEmail } = params;

		const emailHtml = generateTrainerInvitationEmailTemplate(params);

		const { data, error } = await resend.emails.send({
			from: 'TailorMade <team@tailormadebov2.app>',
			to: recipientEmail,
			subject: `☕ You're invited to join TailorMade as a Trainer`,
			html: emailHtml
		});

		if (error) {
			console.error('[sendTrainerInvitation] Resend error:', error);
			return {
				success: false,
				message: `Failed to send invitation: ${error.message}`
			};
		}

		console.log('[sendTrainerInvitation] Email sent successfully to:', recipientEmail);
		return {
			success: true,
			message: `Invitation sent successfully to ${recipientEmail}`,
			emailId: data?.id
		};
	} catch (error) {
		console.error('[sendTrainerInvitation] Unexpected error:', error);
		return {
			success: false,
			message: 'Failed to send trainer invitation email'
		};
	}
}

/**
 * Resend an existing trainer invitation
 */
export async function resendTrainerInvitationEmail(
	params: TrainerInvitationEmailParams
): Promise<{ success: boolean; message: string; emailId?: string }> {
	console.log('[resendTrainerInvitation] Resending invitation to:', params.recipientEmail);
	return sendTrainerInvitation(params);
}
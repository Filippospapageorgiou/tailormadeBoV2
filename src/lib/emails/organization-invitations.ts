// src/lib/emails/organization-invitations.ts
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { dev } from '$app/environment';

const PUBLIC_APP_URL = dev ? 'http://localhost:5173' : 'https://tailormadebov2.app';

const resend = new Resend(RESEND_API_KEY);

interface InvitationEmailParams {
	recipientEmail: string;
	organizationName: string;
	roleName: string;
	inviterName: string;
	inviteToken: string;
	expiresAt: Date;
}

/**
 * Generate HTML email template for organization invitation
 */
function generateInvitationEmailTemplate(params: InvitationEmailParams): string {
	const { organizationName, roleName, inviterName, inviteToken, expiresAt } = params;

	const acceptUrl = `${PUBLIC_APP_URL}/invite/accept?token=${inviteToken}`;
	const logoUrl = `${PUBLIC_APP_URL}/tailor_venetis.png`;
	
	// Format expiration date in Greek
	const expirationFormatted = expiresAt.toLocaleDateString('el-GR', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	return `
		<!DOCTYPE html>
		<html lang="el">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Πρόσκληση στο ${organizationName}</title>
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
										Ο/Η <strong>${inviterName}</strong> θα χαρεί να σε καλωσορίσει<br />
										στην ομάδα <strong>${organizationName}</strong>
									</p>
									
									<!-- Role -->
									<p style="margin: 0 0 36px; text-align: center;">
										<span style="color: #8C7B6B; font-size: 13px; font-style: italic;">
											ως ${roleName}
										</span>
									</p>

									<!-- CTA Button -->
									<div style="text-align: center; margin-bottom: 36px;">
										<a href="${acceptUrl}" 
											style="display: inline-block; background-color: #6B5344; color: #FFFEFA; text-decoration: none; padding: 12px 32px; font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 500; font-size: 13px; border-radius: 4px; letter-spacing: 0.5px;">
											Αποδοχή Πρόσκλησης
										</a>
									</div>

									<!-- Warm closing -->
									<p style="margin: 0; color: #A99888; font-size: 13px; text-align: center; font-style: italic;">
										Σε περιμένουμε
									</p>
								</td>
							</tr>

							<!-- Footer -->
							<tr>
								<td style="padding: 24px 48px; background-color: #F9F6F2;">
									<p style="margin: 0 0 8px; color: #B5A898; font-size: 11px; text-align: center;">
										Η πρόσκληση ισχύει έως ${expirationFormatted}
									</p>
									<p style="margin: 0; color: #C8BDB0; font-size: 10px; text-align: center;">
										Αν δεν αναγνωρίζεις αυτό το μήνυμα, μπορείς να το αγνοήσεις.
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
 * Send organization invitation email via Resend
 */
export async function sendOrganizationInvitation(
	params: InvitationEmailParams
): Promise<{ success: boolean; message: string; emailId?: string }> {
	try {
		const { recipientEmail, organizationName } = params;

		// Generate email HTML
		const emailHtml = generateInvitationEmailTemplate(params);

		// Send email via Resend
		const { data, error } = await resend.emails.send({
			from: 'TailorMade <team@tailormadebov2.app>',
			to: recipientEmail,
			subject: `🎉 You're invited to join ${organizationName} on TailorMade`,
			html: emailHtml
		});

		if (error) {
			console.error('[sendOrganizationInvitation] Resend error:', error);
			return {
				success: false,
				message: `Failed to send invitation: ${error.message}`
			};
		}

		console.log('[sendOrganizationInvitation] Email sent successfully to:', recipientEmail);
		return {
			success: true,
			message: `Invitation sent successfully to ${recipientEmail}`,
			emailId: data?.id
		};
	} catch (error) {
		console.error('[sendOrganizationInvitation] Unexpected error:', error);
		return {
			success: false,
			message: 'Failed to send invitation email'
		};
	}
}

/**
 * Resend an existing invitation
 */
export async function resendOrganizationInvitation(
	params: InvitationEmailParams
): Promise<{ success: boolean; message: string; emailId?: string }> {
	// Same as sending, just with a slightly different log message
	console.log('[resendOrganizationInvitation] Resending invitation to:', params.recipientEmail);
	return sendOrganizationInvitation(params);
}

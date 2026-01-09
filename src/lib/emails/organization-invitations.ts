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
	
	// Format expiration date
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
			<title>You're Invited to Join ${organizationName}</title>
		</head>
		<body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
				<tr>
					<td style="padding: 40px 20px;">
						<table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
							
							<!-- Header with gradient -->
							<tr>
								<td style="padding: 40px 40px 32px; background: linear-gradient(135deg, #D4A574 0%, #8B6B4A 100%); text-align: center;">
									<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
										You're Invited! 🎉
									</h1>
									<p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
										Join the ${organizationName} team
									</p>
								</td>
							</tr>

							<!-- Content -->
							<tr>
								<td style="padding: 40px;">
									
									<!-- Welcome Message -->
									<div style="margin-bottom: 32px;">
										<p style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
											Hello,
										</p>
										<p style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
											<strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on TailorMade.
										</p>
										<p style="margin: 0; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
											You'll be joining as: <strong style="color: #8B6B4A;">${roleName}</strong>
										</p>
									</div>

									<!-- What you'll get access to -->
									<div style="margin-bottom: 32px; padding: 20px; background-color: #fafafa; border-radius: 8px; border-left: 4px solid #D4A574;">
										<h3 style="margin: 0 0 12px; font-size: 14px; color: #525252; text-transform: uppercase; letter-spacing: 0.5px;">
											What you'll have access to:
										</h3>
										<ul style="margin: 0; padding: 0 0 0 20px; color: #525252; font-size: 14px;">
											<li style="margin-bottom: 8px;">Team schedules and shift management</li>
											<li style="margin-bottom: 8px;">Equipment tracking and maintenance logs</li>
											<li style="margin-bottom: 8px;">Recipes and beverage guides</li>
											<li style="margin-bottom: 0;">Daily tasks and checklists</li>
										</ul>
									</div>

									<!-- CTA Button -->
									<div style="text-align: center; margin-bottom: 32px;">
										<a href="${acceptUrl}" 
											style="display: inline-block; background: linear-gradient(135deg, #D4A574 0%, #8B6B4A 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; font-weight: 600; font-size: 16px; border-radius: 8px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(212, 165, 116, 0.4);">
											Accept Invitation
										</a>
									</div>

									<!-- Expiration Notice -->
									<div style="padding: 16px; background-color: #FEF3C7; border-radius: 8px; text-align: center;">
										<p style="margin: 0; color: #92400E; font-size: 13px;">
											⏰ This invitation expires on <strong>${expirationFormatted}</strong>
										</p>
									</div>

									<!-- Link fallback -->
									<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
										<p style="margin: 0 0 8px; color: #737373; font-size: 12px;">
											If the button doesn't work, copy and paste this link into your browser:
										</p>
										<p style="margin: 0; color: #8B6B4A; font-size: 12px; word-break: break-all;">
											${acceptUrl}
										</p>
									</div>
								</td>
							</tr>

							<!-- Footer -->
							<tr>
								<td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
									<p style="margin: 0 0 8px; color: #737373; font-size: 12px; text-align: center;">
										This invitation was sent by TailorMade on behalf of ${organizationName}.
									</p>
									<p style="margin: 0; color: #737373; font-size: 12px; text-align: center;">
										If you didn't expect this invitation, you can safely ignore this email.
									</p>
								</td>
							</tr>
						</table>

						<!-- Bottom branding -->
						<table role="presentation" style="max-width: 600px; margin: 20px auto 0;">
							<tr>
								<td style="text-align: center;">
									<p style="margin: 0; color: #a3a3a3; font-size: 11px;">
										Powered by TailorMade • Coffee Shop Management Platform
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
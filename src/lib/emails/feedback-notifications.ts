// src/lib/emails/feedback-notification.ts
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';

const resend = new Resend(RESEND_API_KEY);

const FEEDBACK_RECIPIENT_EMAIL = 'filpap9@gmail.com';

interface FeedbackNotificationParams {
	userName: string;
	userEmail: string;
	organizationName: string;
	rating: number;
	comment: string;
	submittedAt: Date;
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating: number): string {
	const filledStar = '★';
	const emptyStar = '☆';
	let stars = '';

	for (let i = 1; i <= 5; i++) {
		if (i <= rating) {
			stars += `<span style="color: #D4A574; font-size: 24px;">${filledStar}</span>`;
		} else {
			stars += `<span style="color: #737373; font-size: 24px;">${emptyStar}</span>`;
		}
	}

	return stars;
}

/**
 * Get rating label in Greek
 */
function getRatingLabel(rating: number): string {
	const labels: Record<number, string> = {
		1: 'Πολύ Κακό',
		2: 'Κακό',
		3: 'Μέτριο',
		4: 'Καλό',
		5: 'Εξαιρετικό'
	};
	return labels[rating] || 'Άγνωστο';
}

/**
 * Generate HTML email template for feedback notification
 */
function generateFeedbackEmailTemplate(params: FeedbackNotificationParams): string {
	const { userName, userEmail, organizationName, rating, comment, submittedAt } = params;

	const formattedDate = submittedAt.toLocaleString('el-GR', {
		dateStyle: 'long',
		timeStyle: 'short'
	});

	const ratingColor =
		rating >= 4 ? '#22c55e' : rating >= 3 ? '#f59e0b' : '#ef4444';

	return `
		<!DOCTYPE html>
		<html lang="el">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Νέο Feedback από Χρήστη</title>
		</head>
		<body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
				<tr>
					<td style="padding: 40px 20px;">
						<table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
							
							<!-- Header -->
							<tr>
								<td style="padding: 32px 40px; background: linear-gradient(135deg, #D4A574 0%, #8B6B4A 100%); text-align: center;">
									<h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.3px;">
										📝 Νέο Feedback
									</h1>
									<p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
										TailorMade Application Feedback
									</p>
								</td>
							</tr>

							<!-- Content -->
							<tr>
								<td style="padding: 40px;">
									
									<!-- Rating Section -->
									<div style="text-align: center; margin-bottom: 32px; padding: 24px; background-color: #fafafa; border-radius: 8px;">
										<p style="margin: 0 0 8px 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">
											Βαθμολογία
										</p>
										<div style="margin: 12px 0;">
											${generateStarRating(rating)}
										</div>
										<p style="margin: 8px 0 0; font-size: 18px; font-weight: 600; color: ${ratingColor};">
											${rating}/5 - ${getRatingLabel(rating)}
										</p>
									</div>

									<!-- User Info -->
									<div style="margin-bottom: 24px; padding: 20px; background-color: #fafafa; border-radius: 8px; border-left: 4px solid #D4A574;">
										<h3 style="margin: 0 0 12px 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">
											Στοιχεία Χρήστη
										</h3>
										<table role="presentation" style="width: 100%; border-collapse: collapse;">
											<tr>
												<td style="padding: 4px 0; color: #525252; font-size: 14px;">
													<strong>Όνομα:</strong> ${userName}
												</td>
											</tr>
											<tr>
												<td style="padding: 4px 0; color: #525252; font-size: 14px;">
													<strong>Email:</strong> <a href="mailto:${userEmail}" style="color: #D4A574;">${userEmail}</a>
												</td>
											</tr>
											<tr>
												<td style="padding: 4px 0; color: #525252; font-size: 14px;">
													<strong>Οργανισμός:</strong> ${organizationName}
												</td>
											</tr>
										</table>
									</div>

									<!-- Comment Section -->
									<div style="margin-bottom: 24px;">
										<h3 style="margin: 0 0 12px 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">
											Σχόλιο
										</h3>
										<div style="padding: 20px; background-color: #fafafa; border-radius: 8px; border-left: 4px solid #8B6B4A;">
											<p style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">
												${comment}
											</p>
										</div>
									</div>

									<!-- Timestamp -->
									<div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e5e5;">
										<p style="margin: 0; color: #737373; font-size: 12px;">
											📅 Υποβλήθηκε: ${formattedDate}
										</p>
									</div>
								</td>
							</tr>

							<!-- Footer -->
							<tr>
								<td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
									<p style="margin: 0; color: #737373; font-size: 12px; text-align: center; line-height: 1.5;">
										Αυτό είναι αυτοματοποιημένο email από το σύστημα feedback της TailorMade.<br>
										Μπορείτε να απαντήσετε απευθείας στον χρήστη στο <a href="mailto:${userEmail}" style="color: #D4A574;">${userEmail}</a>
									</p>
								</td>
							</tr>
						</table>

						<!-- Bottom branding -->
						<table role="presentation" style="max-width: 600px; margin: 20px auto 0;">
							<tr>
								<td style="text-align: center;">
									<p style="margin: 0; color: #a3a3a3; font-size: 11px;">
										TailorMade Coffee Roasters • Feedback System
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
 * Send feedback notification email
 */
export async function sendFeedbackNotification(
	params: FeedbackNotificationParams
): Promise<{ success: boolean; message: string; emailId?: string }> {
	try {
		const { userName, rating } = params;

		// Generate email HTML
		const emailHtml = generateFeedbackEmailTemplate(params);

		// Determine emoji based on rating
		const ratingEmoji = rating >= 4 ? '🌟' : rating >= 3 ? '📝' : '⚠️';

		// Send email via Resend
		const { data, error } = await resend.emails.send({
			from: 'TailorMade Feedback <team@tailormadebov2.app>',
			to: FEEDBACK_RECIPIENT_EMAIL,
			subject: `${ratingEmoji} Νέο Feedback (${rating}/5) από ${userName}`,
			html: emailHtml
		});

		if (error) {
			console.error('[sendFeedbackNotification] Resend error:', error);
			return {
				success: false,
				message: `Failed to send notification: ${error.message}`
			};
		}

		console.log('[sendFeedbackNotification] Email sent successfully');
		return {
			success: true,
			message: 'Feedback notification sent successfully',
			emailId: data?.id
		};
	} catch (error) {
		console.error('[sendFeedbackNotification] Unexpected error:', error);
		return {
			success: false,
			message: 'Failed to send feedback notification'
		};
	}
}
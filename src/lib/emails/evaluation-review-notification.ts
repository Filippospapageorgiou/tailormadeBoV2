import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { dev } from '$app/environment';

const PUBLIC_APP_URL = dev ? 'http://localhost:5173' : 'https://tailormadebov2.app';

const resend = new Resend(RESEND_API_KEY);

interface EvaluationReviewParams {
	recipientEmail: string;
	trainerName: string;
	adminName: string;
	storeName: string;
	storeLocation?: string;
	visitDate: string;
	evaluationId: number;
	adminNotes: string | null;
}

function generateReviewEmailTemplate(params: EvaluationReviewParams): string {
	const { trainerName, adminName, storeName, storeLocation, visitDate, evaluationId, adminNotes } =
		params;

	const evalUrl = `${PUBLIC_APP_URL}/trainer/evaluations/${evaluationId}`;
	const logoUrl = `${PUBLIC_APP_URL}/tailor_venetis.png`;

	const formattedDate = new Date(visitDate).toLocaleDateString('el-GR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	return `
		<!DOCTYPE html>
		<html lang="el">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Αξιολόγηση Εξετάστηκε</title>
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

									<!-- Status badge -->
									<div style="text-align: center; margin-bottom: 28px;">
										<span style="display: inline-block; padding: 6px 20px; background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 20px; color: #4338CA; font-size: 13px; font-family: 'Segoe UI', system-ui, sans-serif; letter-spacing: 0.3px;">
											✓ Αξιολόγηση Εξετάστηκε
										</span>
									</div>

									<!-- Greeting -->
									<p style="margin: 0 0 24px; color: #3D3428; font-size: 15px; text-align: center; line-height: 1.8;">
										Αγαπητέ/ή <strong>${trainerName}</strong>
									</p>

									<!-- Notification -->
									<p style="margin: 0 0 32px; color: #3D3428; font-size: 15px; text-align: center; line-height: 1.8;">
										Ο/Η <strong>${adminName}</strong> εξέτασε<br />
										την αξιολόγησή σου για το κατάστημα
									</p>

									<!-- Store info box -->
									<div style="margin: 0 0 28px; padding: 20px; background-color: #F9F6F2; border-radius: 4px; border-left: 3px solid #6B5344;">
										<p style="margin: 0 0 4px; color: #8C7B6B; font-size: 11px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
											Κατάστημα
										</p>
										<p style="margin: 0; color: #3D3428; font-size: 16px; text-align: center; font-weight: bold; font-family: 'Segoe UI', system-ui, sans-serif;">
											${storeName}
										</p>
										${storeLocation ? `<p style="margin: 6px 0 0; color: #A99888; font-size: 12px; text-align: center; font-family: 'Segoe UI', system-ui, sans-serif;">📍 ${storeLocation}</p>` : ''}
									</div>

									<!-- Visit date -->
									<div style="margin: 0 0 28px; padding: 16px; background-color: #F9F6F2; border-radius: 4px; text-align: center;">
										<p style="margin: 0 0 4px; color: #8C7B6B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
											Ημερομηνία Επίσκεψης
										</p>
										<p style="margin: 0; color: #3D3428; font-size: 14px; font-family: 'Segoe UI', system-ui, sans-serif;">
											📅 ${formattedDate}
										</p>
									</div>

									${
										adminNotes
											? `<!-- Admin notes -->
									<div style="margin: 0 0 28px; padding: 20px; background-color: #F0F4FF; border-radius: 4px; border-left: 3px solid #818CF8;">
										<p style="margin: 0 0 8px; color: #6B6B8C; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Segoe UI', system-ui, sans-serif;">
											Σχόλια Διαχειριστή
										</p>
										<p style="margin: 0; color: #3D3428; font-size: 14px; line-height: 1.7; font-family: 'Segoe UI', system-ui, sans-serif;">
											${adminNotes.replace(/\n/g, '<br/>')}
										</p>
									</div>`
											: ''
									}

									<!-- CTA Button -->
									<div style="text-align: center; margin-bottom: 36px;">
										<a href="${evalUrl}"
											style="display: inline-block; background-color: #6B5344; color: #FFFEFA; text-decoration: none; padding: 12px 32px; font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 500; font-size: 13px; border-radius: 4px; letter-spacing: 0.5px;">
											Προβολή Αξιολόγησης
										</a>
									</div>

									<!-- Closing -->
									<p style="margin: 0; color: #A99888; font-size: 13px; text-align: center; font-style: italic;">
										Μπορείτε να δείτε τα αποτελέσματα στην πλατφόρμα.
									</p>
								</td>
							</tr>

							<!-- Footer -->
							<tr>
								<td style="padding: 24px 48px; background-color: #F9F6F2;">
									<p style="margin: 0 0 8px; color: #B5A898; font-size: 11px; text-align: center;">
										Εξετάστηκε: ${new Date().toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}
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
										${evalUrl}
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

export async function sendEvaluationReviewNotification(
	params: EvaluationReviewParams
): Promise<{ success: boolean; message: string; emailId?: string }> {
	try {
		const { recipientEmail, storeName, adminName } = params;

		const emailHtml = generateReviewEmailTemplate(params);

		const { data, error } = await resend.emails.send({
			from: 'TailorMade <team@tailormadebov2.app>',
			to: recipientEmail,
			subject: `✓ Η αξιολόγησή σου εξετάστηκε: ${storeName} — ${adminName}`,
			html: emailHtml
		});

		if (error) {
			console.error('[sendEvaluationReviewNotification] Resend error:', error);
			return { success: false, message: `Failed to send: ${error.message}` };
		}

		console.log('[sendEvaluationReviewNotification] Email sent to:', recipientEmail);
		return { success: true, message: `Email sent to ${recipientEmail}`, emailId: data?.id };
	} catch (err) {
		console.error('[sendEvaluationReviewNotification] Unexpected error:', err);
		return { success: false, message: 'Failed to send review notification' };
	}
}

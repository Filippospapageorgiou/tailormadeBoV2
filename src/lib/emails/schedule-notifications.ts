// src/lib/emails/schedule-notifications.ts
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { dev } from '$app/environment';

const PUBLIC_APP_URL = dev ? 'http://localhost:5173' : 'https://tailormadebov2.app';

const resend = new Resend(RESEND_API_KEY);

interface NewScheduleEmailParams {
	recipientEmail: string;
	employeeName: string;
	organizationName: string;
	weekStartDate: string; // ISO format
	weekEndDate: string;   // ISO format
	scheduleId: string;
}

/**
 * Generate HTML email template for new schedule publication
 */
function generateNewScheduleEmailTemplate(params: NewScheduleEmailParams): string {
	const { employeeName, organizationName, weekStartDate, weekEndDate, scheduleId } = params;

	const scheduleUrl = `${PUBLIC_APP_URL}/app/schedule`;
	const logoUrl = `${PUBLIC_APP_URL}/tailor_venetis.png`;
	
	// Format dates in Greek
	const startDate = new Date(weekStartDate);
	const endDate = new Date(weekEndDate);
	
	const weekRangeFormatted = `${startDate.toLocaleDateString('el-GR', {
		day: 'numeric',
		month: 'long'
	})} - ${endDate.toLocaleDateString('el-GR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	})}`;

	const publishDate = new Date().toLocaleDateString('el-GR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});

	return `
		<!DOCTYPE html>
		<html lang="el">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Νέο Εβδομαδιαίο Πρόγραμμα - ${organizationName}</title>
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
										Αγαπητέ/ή <strong>${employeeName}</strong>
									</p>
									
									<!-- Notification -->
									<p style="margin: 0 0 36px; color: #3D3428; font-size: 15px; text-align: center; line-height: 1.8;">
										Το νέο εβδομαδιαίο πρόγραμμα για την ομάδα<br />
										<strong>${organizationName}</strong><br />
										μόλις δημοσιεύτηκε
									</p>

									<!-- Week Info Box -->
									<div style="margin: 0 0 36px; padding: 24px; background-color: #F9F6F2; border-radius: 4px; border-left: 3px solid #6B5344;">
										<p style="margin: 0; color: #8C7B6B; font-size: 12px; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
											Εβδομάδα
										</p>
										<p style="margin: 0; color: #3D3428; font-size: 16px; text-align: center; font-weight: bold;">
											${weekRangeFormatted}
										</p>
									</div>

									<!-- CTA Button -->
									<div style="text-align: center; margin-bottom: 36px;">
										<a href="${scheduleUrl}" 
											style="display: inline-block; background-color: #6B5344; color: #FFFEFA; text-decoration: none; padding: 12px 32px; font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 500; font-size: 13px; border-radius: 4px; letter-spacing: 0.5px;">
											Προβολή Προγράμματος
										</a>
									</div>

									<!-- Warm closing -->
									<p style="margin: 0; color: #A99888; font-size: 13px; text-align: center; font-style: italic;">
										Καλή εβδομάδα!
									</p>
								</td>
							</tr>

							<!-- Footer -->
							<tr>
								<td style="padding: 24px 48px; background-color: #F9F6F2;">
									<p style="margin: 0 0 8px; color: #B5A898; font-size: 11px; text-align: center;">
										Δημοσιεύτηκε: ${publishDate}
									</p>
									<p style="margin: 0; color: #C8BDB0; font-size: 10px; text-align: center;">
										Αν χρειάζεστε αλλαγές στο πρόγραμμα, επικοινωνήστε με τον διαχειριστή.
									</p>
								</td>
							</tr>
						</table>

						<!-- Schedule URL fallback -->
						<table role="presentation" style="max-width: 460px; margin: 24px auto 0;">
							<tr>
								<td style="text-align: center;">
									<p style="margin: 0; color: #C8BDB0; font-size: 10px; font-family: 'Segoe UI', system-ui, sans-serif;">
										${scheduleUrl}
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
 * Send new schedule notification email to employee
 */
export async function sendNewScheduleNotification(
	params: NewScheduleEmailParams
): Promise<{ success: boolean; message: string; emailId?: string }> {
	try {
		const { recipientEmail, employeeName, organizationName } = params;

		// Generate email HTML
		const emailHtml = generateNewScheduleEmailTemplate(params);

		// Send email via Resend
		const { data, error } = await resend.emails.send({
			from: 'TailorMade Schedules <schedules@tailormadebov2.app>',
			to: recipientEmail,
			subject: `📅 Νέο Πρόγραμμα Εργασίας • ${organizationName}`,
			html: emailHtml
		});

		if (error) {
			console.error('[sendNewScheduleNotification] Resend error:', error);
			return {
				success: false,
				message: `Failed to send schedule notification: ${error.message}`
			};
		}

		console.log('[sendNewScheduleNotification] Email sent successfully to:', recipientEmail);
		return {
			success: true,
			message: `Schedule notification sent successfully to ${recipientEmail}`,
			emailId: data?.id
		};
	} catch (error) {
		console.error('[sendNewScheduleNotification] Unexpected error:', error);
		return {
			success: false,
			message: 'Failed to send schedule notification email'
		};
	}
}

export async function sendBulkScheduleNotifications(
    paramsArray: NewScheduleEmailParams[]
): Promise<{ success: boolean; sentCount: number; failedCount: number; errors: string[] }> {
    console.log(`[sendBulkScheduleNotifications] Sending to ${paramsArray.length} employees...`);
    
    try {
        // Prepare batch emails
        const emails = paramsArray.map(params => ({
            from: 'TailorMade Schedules <schedules@tailormadebov2.app>',
            to: params.recipientEmail,
            subject: `📅 Νέο Πρόγραμμα Εργασίας • ${params.organizationName}`,
            html: generateNewScheduleEmailTemplate(params)
        }));

        // Send all at once with batch API
        const { data, error } = await resend.batch.send(emails);

        if (error) {
            console.error('[sendBulkScheduleNotifications] Batch error:', error);
            return {
                success: false,
                sentCount: 0,
                failedCount: paramsArray.length,
                errors: [error.message]
            };
        }

        console.log('[sendBulkScheduleNotifications] Batch sent successfully:', data);
        return {
            success: true,
            sentCount: paramsArray.length,
            failedCount: 0,
            errors: []
        };

    } catch (err) {
        console.error('[sendBulkScheduleNotifications] Unexpected error:', err);
        return {
            success: false,
            sentCount: 0,
            failedCount: paramsArray.length,
            errors: ['Batch send failed']
        };
    }
}
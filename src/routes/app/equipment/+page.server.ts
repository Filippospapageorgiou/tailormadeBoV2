// src/routes/app/equipment/+page.server.ts
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { sendMaintanceNotification } from '$lib/emails/equipment-notifications';
import { getUserProfile } from '$lib/supabase/queries';
import type { Equipment } from '$lib/models/equipment.types';

export const actions = {
	addMaintenanceLog: async ({ locals: { supabase, user }, request, url }) => {
		const data = await request.formData();

		const equipmentId = data.get('equipmentId') as string;
		const issueDescription = data.get('issueDescription') as string;
		const actionTaken = data.get('actionTaken') as string;
		const allFiles = data.getAll('images') as File[];

		const validFiles = allFiles.filter((file) => file.size > 0 && file.name.length > 0);

		if (!issueDescription || !actionTaken) {
			return fail(400, { message: 'Description and Action are required' });
		}

		try {
			const imageUrls: string[] = [];

			// Upload images to storage
			for (const file of validFiles) {
				const path = `maintenance-logs/${equipmentId}-${Date.now()}-${file.name}`;
				const fileBuffer = await file.arrayBuffer();

				const { data: uploadData, error: uploadError } = await supabase.storage
					.from('equipment-images')
					.upload(path, fileBuffer, {
						contentType: file.type,
						upsert: false
					});

				if (uploadError) {
					console.error('Upload error details:', uploadError);
					throw uploadError;
				}

				const {
					data: { publicUrl }
				} = supabase.storage.from('equipment-images').getPublicUrl(path);

				imageUrls.push(publicUrl);
			}

			// Insert maintenance log into database
			const { error: dbError } = await supabase.from('maintenance_logs').insert({
				equipment_id: equipmentId,
				issue_description: issueDescription,
				action_taken: actionTaken,
				images: imageUrls,
				user_id: user?.id,
				created_at: new Date().toISOString()
			});

			if (dbError) throw dbError;

			// ========================================
			// NEW: Send Email Notification
			// ========================================
			try {
				// Fetch equipment details
				const { data: equipment, error: equipmentError } = await supabase
					.from('equipment')
					.select('*')
					.eq('id', equipmentId)
					.single<Equipment>();

				if (equipmentError || !equipment) {
					console.error(
						'[addMaintenanceLog] Failed to fetch equipment for notification:',
						equipmentError
					);
					// Don't fail the entire action - log was still created successfully
				} else {
					// Get reporter profile
					const reporterProfile = await getUserProfile();

					// Construct equipment page URL
					const equipmentPageUrl = `${url.origin}/app/settings/equipment_settings`;

					// Send notification
					const notificationResult = await sendMaintanceNotification({
						equipment,
						issueDescription,
						actionTaken,
						reportedBy: reporterProfile,
						equipmentPageUrl
					});

					if (notificationResult.success) {
						console.log(
							`[addMaintenanceLog] Notification sent to ${notificationResult.sentCount} recipient(s)`
						);
					} else {
						console.error('[addMaintenanceLog] Notification failed:', notificationResult.message);
					}
				}
			} catch (emailError) {
				// Email notification is not critical - don't fail the maintenance log creation
				console.error('[addMaintenanceLog] Email notification error (non-critical):', emailError);
			}
			// ========================================
			// END: Email Notification
			// ========================================

			return { success: true };
		} catch (error) {
			console.error('Server Action Error:', error);
			return fail(500, { message: 'Failed to upload log' });
		}
	}
} satisfies Actions;

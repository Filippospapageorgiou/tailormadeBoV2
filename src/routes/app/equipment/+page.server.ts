import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions = {
	addMaintenanceLog: async ({ locals: { supabase, user }, request }) => {
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

			for (const file of validFiles) {
				const path = `maintenance-logs/${data.get('equipmentId')}-${Date.now()}-${file.name}`;

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

			const { error: dbError } = await supabase.from('maintenance_logs').insert({
				equipment_id: equipmentId,
				issue_description: issueDescription,
				action_taken: actionTaken,
				images: imageUrls,
				user_id: user?.id,
				created_at: new Date().toISOString()
			});

			if (dbError) throw dbError;

			return { success: true };
		} catch (error) {
			console.error('Server Action Error:', error);
			return fail(500, { message: 'Failed to upload log' });
		}
	}
} satisfies Actions;

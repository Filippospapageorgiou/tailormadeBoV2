import { query, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { getAuthenticatedUser, requireAuthenticatedUser } from '$lib/supabase/shared';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getUserOrgId, getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { type MaintenanceLog, type EquipmentWithLogs } from '$lib/models/equipment.types';
import { Trophy } from 'lucide-svelte';

export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([1, 2]);
	return {
		profile,
		success: true
	};
});

export const getAllEquipments = query(async () => {
	try {
		const supabase = createServerClient();
		const org_id = await getUserOrgId();

		const { data: equipments, error: equipmentsError } = await supabase
			.from('equipment')
			.select(
				`
				*,
				maintenance_logs (
					*,
					profiles (
						username,
						role,
						image_url
					)
				)
			`
			)
			.eq('org_id', org_id)
			.overrideTypes<EquipmentWithLogs[]>();

		if (equipmentsError) {
			console.error('[getAllEquipments] Error fetching all equipments: ', equipmentsError);
			return {
				success: false,
				equipments: [],
				total: 0,
				message: 'Σφάλμα κάτα την άνακτηση των μηχανημάτων'
			};
		}

		return {
			success: true,
			equipments: equipments || [],
			total: equipments.length || 0,
			message: 'Επιτυχής ανάκτηση μηχανημάτων'
		};
	} catch (error: any) {
		console.error('[getAllEquipments] Error fetching all equipments: ', error);
		return {
			success: false,
			equipments: [],
			total: 0,
			message: 'Σφάλμα κάτα την άνακτηση των μηχανημάτων'
		};
	}
});

const EquipmentSchema = z.object({
	id: z.string(),
	name: z.string(),
	model: z.string(),
	serial_number: z.string().optional(),
	image_url: z
		.instanceof(File, { error: 'Please upload a file.' })
		.refine((file) => file.size > 0, 'File cannot be empty.')
		.refine((file) => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.')
		.refine(
			(file) =>
				['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
			'Only image files (JPEG, PNG, WebP, GIF) are allowed.'
		)
		.optional(),
	manual_url: z.string().optional(),
	status: z.string(),
	last_service_date: z.string(),
	next_service_date: z.string()
});

export const addEquipment = form(EquipmentSchema, async (data) => {
	const supabase = createServerClient();
	let imageUrl = '';
	try {
		if (data.image_url && data.image_url instanceof File) {
			const fileExt = data.image_url.name.split('.').pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
			const filePath = `${data.name}/${fileName}`;

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('equipment')
				.upload(filePath, data.image_url, {
					cacheControl: '3600',
					upsert: false
				});

			if (uploadError) {
				console.error('[addEquipment] Error adding equipment: ', uploadError);
				return {
					success: false,
					message: 'Ένα σφάλμα παρασουσιάστηκε κάτα την πρόσθεση του μηχανήματος'
				};
			}

			const { data: urlData } = supabase.storage.from('equipment').getPublicUrl(uploadData.path);

			imageUrl = urlData.publicUrl;
		}

		const { error: insertError } = await supabase.from('equipment').insert({
			name: data.name,
			model: data.model,
			serial_number: data.serial_number,
			image_url: imageUrl,
			manual_url: data.manual_url,
			status: data.status,
			last_service_date: data.last_service_date,
			next_service_date: data.next_service_date,
			create_at: Date.now()
		});

		if (insertError) {
			console.error('[addEquipment] Error adding equipment: ', insertError);
			return {
				success: false,
				message: 'Ένα σφάλμα παρασουσιάστηκε κάτα την πρόσθεση του μηχανήματος'
			};
		}

		return {
			success: true,
			message: 'Eξοπλισμός προστέθηκε επιτυχώς'
		};
	} catch (error) {
		console.error('[addEquipment] Error adding equipment: ', error);
		return {
			success: false,
			message: 'Ένα σφάλμα παρασουσιάστηκε κάτα την πρόσθεση του μηχανήματος'
		};
	}
});

export const editEquipment = form(EquipmentSchema, async (data) => {
	const supabase = createServerClient();
	try {
		let imageUrl = undefined;

		if (data.image_url && data.image_url instanceof File) {
			const { data: currentEquipment } = await supabase
				.from('equipment')
				.select('image_url')
				.eq('id', data.id)
				.single();

			if (currentEquipment?.image_url && currentEquipment.image_url.includes('equipment')) {
				const oldPath = currentEquipment.image_url.split('/equipment/')[1];
				if (oldPath) {
					await supabase.storage.from('equipment').remove([oldPath]);
				}
			}

			const fileExt = data.image_url.name.split('.').pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
			const filePath = `${data.name}/${fileName}`;

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('equipment')
				.upload(filePath, data.image_url, {
					cacheControl: '3600',
					upsert: false
				});

			if (uploadError) {
				console.error('[addEquipment] Error adding equipment: ', uploadError);
				return {
					success: false,
					message: 'Ένα σφάλμα παρασουσιάστηκε κάτα την πρόσθεση του μηχανήματος'
				};
			}

			const { data: urlData } = supabase.storage.from('equipment').getPublicUrl(uploadData.path);

			imageUrl = urlData.publicUrl;
		}

		const updateData: any = {
			name: data.name,
			model: data.model,
			serial_number: data.serial_number,
			image_url: imageUrl,
			manual_url: data.manual_url,
			status: data.status,
			last_service_date: data.last_service_date,
			next_service_date: data.next_service_date
		};

		if (imageUrl) {
			updateData.image_url = imageUrl;
		}

		const { error } = await supabase.from('equipment').update(updateData).eq('id', data.id);

		if (error) {
			console.error('[editEquipment] error editing equipment: ', error);
			return {
				success: false,
				message: 'Σφάλμα παρουσιαστήκε κάτα την ενημέρωση εξοπλισμού'
			};
		}

		return {
			success: true,
			message: 'Eξοπλισμός ενημερώθηκε επιτυχώς'
		};
	} catch (error) {
		console.error('[editEquipment] error editing equipment: ', error);
		return {
			success: false,
			message: 'Σφάλμα παρουσιαστήκε κάτα την ενημέρωση εξοπλισμού'
		};
	}
});

const deleteEquipmentSchema = z.object({
	equipmentId: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().int().positive())
});

export const deleteEquipment = form(deleteEquipmentSchema, async ({ equipmentId }) => {
	const supabase = createServerClient();

	try {
		const { data: currentEquipment } = await supabase
			.from('equipment')
			.select('image_url')
			.eq('id', equipmentId)
			.single();

		if (currentEquipment?.image_url && currentEquipment.image_url.includes('equipment')) {
			const oldPath = currentEquipment.image_url.split('/equipment/')[1];
			if (oldPath) {
				await supabase.storage.from('beverages').remove([oldPath]);
			}
		}

		const { error } = await supabase.from('equipment').delete().eq('id', equipmentId);

		if (error) {
			console.error('[deleteEquipment] Error deleting equipment: ', error);
			return {
				success: false,
				message: 'Σφάλμα κάτα την διαγραφή του μηχανήματος'
			};
		}

		return {
			success: true,
			message: 'Επιτυχώς διαγραφή μηχανήματος.'
		};
	} catch (error: any) {
		console.error('[deleteEquipment] Error deleting equipment: ', error);
		return {
			success: false,
			message: 'Σφάλμα κάτα την διαγραφή του μηχανήματος'
		};
	}
});

const deleteLog = z.object({
	maintanceLogId: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().int().positive())
});

export const deleteMaintanceLog = form(deleteLog, async ({ maintanceLogId }) => {
	const supabase = createServerClient();
	try {
		const { data: currentLog, error: logsError } = await supabase
			.from('maintenance_logs')
			.select('*')
			.eq('id', maintanceLogId)
			.single<MaintenanceLog>();

		if (logsError) throw logsError;

		if (currentLog && currentLog.images && currentLog.images.length > 0) {
			const filePaths = currentLog.images
				.map((url) => {
					const pathMatch = url.split('equipment-images/')[1];
					return pathMatch;
				})
				.filter(Boolean);

			// Delete files from storage
			if (filePaths.length > 0) {
				const { error: deleteStorageError } = await supabase.storage
					.from('equipment-images')
					.remove(filePaths);

				if (deleteStorageError) {
					console.error('Storage deletion error:', deleteStorageError);
					throw deleteStorageError;
				}
			}
		}

		// Delete the maintenance log record from database
		const { error: deleteDbError } = await supabase
			.from('maintenance_logs')
			.delete()
			.eq('id', maintanceLogId);

		if (deleteDbError) throw deleteDbError;

		return {
			success: true,
			message: 'Το αρχείο καταγραφής συντήρησης διαγράφηκε με επιτυχία'
		};
	} catch (error: any) {
		console.error('[deleteMaintanceLog] Error deleting maintance log: ', error);
		return {
			success: false,
			message: 'Σφάλμα κάτα την διαγραφή του αρχείου καταγραφής συντήρησης'
		};
	}
});

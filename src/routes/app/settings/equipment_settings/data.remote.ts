import { query, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { z } from 'zod/v4';
import { getUserOrgId, getUserProfile, getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import {
	type MaintenanceLog,
	type EquipmentWithLogCount,
	type MaintenanceLogWithUser
} from '$lib/models/equipment.types';
import { optimizeImage } from '$lib/image';

/**
 * HELPER: sanitizePath
 * Converts Greek characters to Latin and cleans strings for Supabase Storage paths.
 */
const sanitizePath = (str: string) => {
	const greekMap: Record<string, string> = {
		Α: 'A',
		Β: 'B',
		Γ: 'G',
		Δ: 'D',
		Ε: 'E',
		Ζ: 'Z',
		Η: 'H',
		Θ: 'TH',
		Ι: 'I',
		Κ: 'K',
		Λ: 'L',
		Μ: 'M',
		Ν: 'N',
		Ξ: 'X',
		Ο: 'O',
		Π: 'P',
		Ρ: 'R',
		Σ: 'S',
		Τ: 'T',
		Υ: 'Y',
		Φ: 'F',
		Χ: 'CH',
		Ψ: 'PS',
		Ω: 'O',
		α: 'a',
		β: 'b',
		γ: 'g',
		δ: 'd',
		ε: 'e',
		ζ: 'z',
		η: 'h',
		θ: 'th',
		ι: 'i',
		κ: 'k',
		λ: 'l',
		μ: 'm',
		ν: 'n',
		ξ: 'x',
		ο: 'o',
		π: 'p',
		ρ: 'r',
		σ: 's',
		τ: 't',
		υ: 'y',
		φ: 'f',
		χ: 'ch',
		ψ: 'ps',
		ω: 'o',
		ς: 's',
		ϊ: 'i',
		ϋ: 'y',
		ό: 'o',
		ύ: 'u',
		ώ: 'w',
		ή: 'h',
		έ: 'e',
		ί: 'i'
	};

	return str
		.split('')
		.map((char) => greekMap[char] || char)
		.join('')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, '-')
		.replace(/[^a-zA-Z0-9\-_]/g, '')
		.toLowerCase();
};

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
				`*,
        		maintenance_logs!inner(count)
    			`
			)
			.eq('org_id', org_id)
			.eq('maintenance_logs.status', 'open')
			.overrideTypes<EquipmentWithLogCount[]>();

		if (equipmentsError) {
			console.error('[getAllEquipments] Error fetching all equipments: ', equipmentsError);
			return {
				success: false,
				equipments: [],
				total: 0,
				message: 'Σφάλμα κάτα την άνακτηση των μηχανημάτων'
			};
		}

		// Optimize images through Vercel Image Optimization (resize + WebP/AVIF)
		const optimizedEquipments = (equipments || []).map((e) => ({
			...e,
			image_url: optimizeImage(e.image_url, 400, 75),
			maintenance_logs: e.maintenance_logs as [{ count: number }]
		}));

		return {
			success: true,
			equipments: optimizedEquipments,
			total: optimizedEquipments.length || 0,
			message: 'Επιτυχής ανάκτηση μηχανημάτων'
		};
	} catch (err: any) {
		console.error('[getAllEquipments] Error fetching all equipments: ', err);
		return {
			success: false,
			equipments: [],
			total: 0,
			message: 'Σφάλμα κάτα την άνακτηση των μηχανημάτων'
		};
	}
});

const getEquipmentByIdSchema = z.object({
	equipmentId: z.number().positive()
});

export const getEquipmentById = query(getEquipmentByIdSchema, async ({ equipmentId }) => {
	try {
		const supabase = createServerClient();
		const org_id = await getUserOrgId();

		const { data: equipment, error } = await supabase
			.from('equipment')
			.select('*')
			.eq('id', equipmentId)
			.eq('org_id', org_id)
			.single();

		if (error) {
			console.error('[getEquipmentById] Error: ', error);
			return { success: false, equipment: null };
		}

		return { success: true, equipment };
	} catch (err: any) {
		console.error('[getEquipmentById] Error: ', err);
		return { success: false, equipment: null };
	}
});

const getAllMaintenanceLogsSchema = z.object({
	equipmentId: z.number().positive()
});

export const getAllMaintenanceLogs = query(getAllMaintenanceLogsSchema, async ({ equipmentId }) => {
	try {
		const supabase = createServerClient();

		const { data: logs, error } = await supabase
			.from('maintenance_logs')
			.select(
				`
				*,
				profiles!maintenance_logs_user_id_fkey (
					username,
					role,
					image_url,
					phone
				),
				resolved_profile:profiles!maintenance_logs_resolved_by_fkey (
					username,
					image_url
				)
			`
			)
			.eq('equipment_id', equipmentId)
			.order('created_at', { ascending: false })
			.overrideTypes<
				(MaintenanceLogWithUser & {
					resolved_profile: { username: string; image_url: string | null } | null;
				})[]
			>();

		if (error) {
			console.error('[getAllMaintenanceLogs] Error fetching logs: ', error);
			return { success: false, logs: [] };
		}

		return { success: true, logs: logs || [] };
	} catch (err: any) {
		console.error('[getAllMaintenanceLogs] Error fetching logs: ', err);
		return { success: false, logs: [] };
	}
});

const getMaintenanceLogsSchema = z.object({
	equipmentId: z.number().positive()
});

export const getMaintenanceLogs = query(getMaintenanceLogsSchema, async (equipmentId) => {
	try {
		const supabase = createServerClient();

		const { data: logs, error } = await supabase
			.from('maintenance_logs')
			.select(
				`
				*,
				profiles!maintenance_logs_user_id_fkey (
					username,
					role,
					image_url,
					phone
				)
			`
			)
			.eq('equipment_id', equipmentId.equipmentId)
			.eq('status', 'open')
			.order('created_at', { ascending: false })
			.overrideTypes<MaintenanceLogWithUser[]>();

		if (error) {
			console.error('[getMaintenanceLogs] Error fetching logs: ', error);
			return { success: false, logs: [] };
		}

		return { success: true, logs: logs || [] };
	} catch (err: any) {
		console.error('[getMaintenanceLogs] Error fetching logs: ', err);
		return { success: false, logs: [] };
	}
});

const EquipmentSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	model: z.string(),
	serial_number: z.string().optional(),
	image_url: z
		.instanceof(File, { error: 'Please upload a file.' })
		.refine((file) => file.size > 0, 'File cannot be empty.')
		.refine((file) => file.size < 10 * 1024 * 1024, 'File size must be less than 10MB.')
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
	const user = await getUserProfile();
	let imageUrl = '';
	try {
		if (data.image_url && data.image_url instanceof File) {
			const sanitizedName = sanitizePath(data.name);
			const fileExt = data.image_url.name.split('.').pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
			const filePath = `private/${sanitizedName}/${fileName}`;

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
			org_id: user.org_id,
			name: data.name,
			model: data.model,
			serial_number: data.serial_number,
			image_url: imageUrl,
			manual_url: data.manual_url,
			status: data.status,
			last_service_date: data.last_service_date,
			next_service_date: data.next_service_date
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
	} catch (err) {
		console.error('[addEquipment] Error adding equipment: ', err);
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

		const { data: currentEquipment } = await supabase
			.from('equipment')
			.select('image_url')
			.eq('id', data.id)
			.single();

		if (data.image_url && data.image_url instanceof File) {
			if (currentEquipment?.image_url && currentEquipment.image_url.includes('equipment')) {
				const oldPath = currentEquipment.image_url.split('/equipment/')[1]?.split('?')[0];
				if (oldPath) {
					await supabase.storage.from('equipment').remove([oldPath]);
				}
			}

			const sanitizedName = sanitizePath(data.name);
			const fileExt = data.image_url.name.split('.').pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
			const filePath = `private/${sanitizedName}/${fileName}`;

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('equipment')
				.upload(filePath, data.image_url, {
					cacheControl: '3600',
					upsert: false
				});

			if (uploadError) {
				console.error('[editEquipment] Upload error: ', uploadError);
				return {
					success: false,
					message: 'Σφάλμα κατά το ανέβασμα της εικόνας'
				};
			}

			const { data: urlData } = supabase.storage.from('equipment').getPublicUrl(uploadData.path);
			imageUrl = urlData.publicUrl;
		}

		const updateData: any = {
			name: data.name,
			model: data.model,
			serial_number: data.serial_number,
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
	} catch (err) {
		console.error('[editEquipment] error editing equipment: ', err);
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
			const oldPath = currentEquipment.image_url.split('/equipment/')[1].split('?')[0];
			if (oldPath) {
				await supabase.storage.from('equipment').remove([oldPath]);
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
	} catch (err: any) {
		console.error('[deleteEquipment] Error deleting equipment: ', err);
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

		const { error: deleteDbError } = await supabase
			.from('maintenance_logs')
			.delete()
			.eq('id', maintanceLogId);

		if (deleteDbError) throw deleteDbError;

		return {
			success: true,
			message: 'Το αρχείο καταγραφής συντήρησης διαγράφηκε με επιτυχία'
		};
	} catch (err: any) {
		console.error('[deleteMaintanceLog] Error deleting maintance log: ', err);
		return {
			success: false,
			message: 'Σφάλμα κάτα την διαγραφή του αρχείου καταγραφής συντήρησης'
		};
	}
});

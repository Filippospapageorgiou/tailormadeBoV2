import { query, command } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { getUserProfile, getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';

// ============================================================
// AUTH - Trainer access (role_id = 3)
// ============================================================

export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([3]); // 3 = trainer
	return { profile };
});

// ============================================================
// LOAD: Trainer's assigned orgs (for starting a new evaluation)
// ============================================================

/**
 * Get organizations the current trainer is assigned to
 */
export const getMyAssignedOrgs = query(async () => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	const { data: assignments, error: assignError } = await supabase
		.from('trainer_org_assigments')
		.select(
			`
      *,
      core_organizations!trainer_org_assigments_org_id_fkey (
        *
      )
    `
		)
		.eq('trainer_id', profile.id)
		.eq('is_active', true);

	if (assignError) {
		console.error('[getMyAssignedOrgs] Error:', assignError);
		throw error(500, 'Failed to fetch assigned organizations');
	}
	return {
		assignments: assignments ?? []
	};
});

/**
 * Get staff members of an organization (for store_managers & baristas_on_duty fields)
 */
const getOrgStaffSchema = z.object({
	orgId: z.number().int().positive()
});

export const getOrgStaff = query(getOrgStaffSchema, async ({ orgId }) => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	// Verify trainer is assigned to this org
	const { data: assignment } = await supabase
		.from('trainer_org_assigments')
		.select('id')
		.eq('trainer_id', profile.id)
		.eq('org_id', orgId)
		.eq('is_active', true)
		.maybeSingle();

	if (!assignment) {
		throw error(403, 'You are not assigned to this organization');
	}

	const { data: staff, error: staffError } = await supabase
		.from('profiles')
		.select('id, username, full_name, email, role_id, image_url, is_manager')
		.eq('org_id', orgId)
		.order('full_name', { ascending: true });

	if (staffError) {
		console.error('[getOrgStaff] Error:', staffError);
		throw error(500, 'Failed to fetch staff');
	}

	return staff ?? [];
});

/**
 * Get equipment for an organization (for machine data section)
 */
const getOrgEquipmentSchema = z.object({
	orgId: z.number().int().positive()
});

export const getOrgEquipment = query(getOrgEquipmentSchema, async ({ orgId }) => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	// Verify trainer is assigned to this org
	const { data: assignment } = await supabase
		.from('trainer_org_assigments')
		.select('id')
		.eq('trainer_id', profile.id)
		.eq('org_id', orgId)
		.eq('is_active', true)
		.maybeSingle();

	if (!assignment) {
		throw error(403, 'You are not assigned to this organization');
	}

	const { data: equipment, error: equipError } = await supabase
		.from('equipment')
		.select(
			'id, name, model, serial_number, image_url, status, last_service_date, next_service_date'
		)
		.eq('org_id', orgId)
		.order('name', { ascending: true });

	if (equipError) {
		console.error('[getOrgEquipment] Error:', equipError);
		throw error(500, 'Failed to fetch equipment');
	}

	return equipment ?? [];
});

// ============================================================
// CREATE: Start a new evaluation (draft)
// ============================================================

const createEvaluationSchema = z.object({
	orgId: z.number().int().positive(),
	visitDate: z.string().date(),
	storeManagers: z.array(z.string().uuid()).default([]),
	baristasOnDuty: z.array(z.string().uuid()).default([])
});

export const createEvaluation = command(
	createEvaluationSchema,
	async ({ orgId, visitDate, storeManagers, baristasOnDuty }) => {
		const supabase = createServerClient();
		const profile = await getUserProfileWithRoleCheck([3]);

		// Verify trainer is assigned to this org
		const { data: assignment } = await supabase
			.from('trainer_org_assigments')
			.select('id')
			.eq('trainer_id', profile.id)
			.eq('org_id', orgId)
			.eq('is_active', true)
			.maybeSingle();

		if (!assignment) {
			throw error(403, 'You are not assigned to this organization');
		}

		const { data: evaluation, error: insertError } = await supabase
			.from('store_evaluations')
			.insert({
				org_id: orgId,
				trainer_id: profile.id,
				visit_date: visitDate,
				store_managers: storeManagers,
				baristas_on_duty: baristasOnDuty,
				status: 'draft'
			})
			.select('id')
			.single();

		if (insertError) {
			console.error('[createEvaluation] Error:', insertError);
			throw error(500, 'Failed to create evaluation');
		}

		return { evaluationId: evaluation.id };
	}
);

// ============================================================
// LOAD: Full evaluation with all child data (for editing)
// ============================================================

const getEvaluationSchema = z.object({
	evaluationId: z.number().int().positive()
});

export const getEvaluation = query(getEvaluationSchema, async ({ evaluationId }) => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	const { data: evaluation, error: evalError } = await supabase
		.from('store_evaluations')
		.select(
			`
      *,
      core_organizations!store_evaluations_org_id_fkey (
        id,
        store_name,
        email,
        phone,
        status,
        location
      ),
      evaluation_sections (
        id,
        section_key,
        rating,
        notes
      ),
      evaluation_check_items (
        id,
        section_key,
        item_key,
        checked,
        value_text,
        value_numeric,
        notes
      ),
      evaluation_machine_data (
        id,
        equipment_id,
        checked,
        value_text,
        value_numeric,
        notes,
        equipment:equipment!evaluation_machine_data_equipment_id_fkey (
          id,
          name,
          model,
          serial_number
        )
      ),
      evaluation_photos (
        id,
        section_key,
        photo_url,
        photo_label,
        caption,
        display_order
      ),
      evaluation_action_items (
        id,
        category,
        description,
        priority,
        resolved,
        resolved_at,
        resolved_by
      ),
      evaluation_water_filter (
        id,
        last_change_date,
        filter_type,
        supplier,
        needs_replacement
      )
    `
		)
		.eq('id', evaluationId)
		.eq('trainer_id', profile.id)
		.single();

	if (evalError) {
		console.error('[getEvaluation] Error:', evalError);
		throw error(404, 'Evaluation not found or access denied');
	}

	return evaluation;
});

// ============================================================
// LIST: Trainer's own evaluations
// ============================================================

export const getMyEvaluations = query(async () => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	const { data: evaluations, error: evalError } = await supabase
		.from('store_evaluations')
		.select(
			`
      id,
      org_id,
      visit_date,
      submit,
      overall_rating,
      submitted_at,
      created_at,
      core_organizations!store_evaluations_org_id_fkey (
        id,
        store_name,
        location
      )
    `
		)
		.eq('trainer_id', profile.id)
		.order('visit_date', { ascending: false });

	if (evalError) {
		console.error('[getMyEvaluations] Error:', evalError);
		throw error(500, 'Failed to fetch evaluations');
	}

	return {
		evaluations: evaluations ?? []
	};
});

// ============================================================
// UPDATE: Evaluation header (visit info, overall rating/comments)
// ============================================================

const updateEvaluationHeaderSchema = z.object({
	evaluationId: z.number().int().positive(),
	visitDate: z.string().date().optional(),
	storeManagers: z.array(z.string().uuid()).optional(),
	baristasOnDuty: z.array(z.string().uuid()).optional(),
	overallRating: z.number().int().min(1).max(5).optional(),
	overallComments: z.string().optional()
});

export const updateEvaluationHeader = command(
	updateEvaluationHeaderSchema,
	async ({
		evaluationId,
		visitDate,
		storeManagers,
		baristasOnDuty,
		overallRating,
		overallComments
	}) => {
		const supabase = createServerClient();
		const profile = await getUserProfileWithRoleCheck([3]);

		// Build update object with only provided fields
		const updateData: Record<string, unknown> = {
			updated_at: new Date().toISOString()
		};
		if (visitDate !== undefined) updateData.visit_date = visitDate;
		if (storeManagers !== undefined) updateData.store_managers = storeManagers;
		if (baristasOnDuty !== undefined) updateData.baristas_on_duty = baristasOnDuty;
		if (overallRating !== undefined) updateData.overall_rating = overallRating;
		if (overallComments !== undefined) updateData.overall_comments = overallComments;

		const { error: updateError } = await supabase
			.from('store_evaluations')
			.update(updateData)
			.eq('id', evaluationId)
			.eq('trainer_id', profile.id)
			.in('status', ['draft', 'reopened']);

		if (updateError) {
			console.error('[updateEvaluationHeader] Error:', updateError);
			throw error(500, 'Failed to update evaluation');
		}

		return { success: true };
	}
);

// ============================================================
// SAVE: Evaluation Sections (upsert - batch)
// ============================================================

const saveSectionsSchema = z.object({
	evaluationId: z.number().int().positive(),
	sections: z.array(
		z.object({
			sectionKey: z.string().min(1),
			rating: z.string().optional(),
			notes: z.string().optional()
		})
	)
});

export const saveSections = command(saveSectionsSchema, async ({ evaluationId, sections }) => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	// Verify ownership & editable status
	await verifyEvaluationOwnership(supabase, evaluationId, profile.id);

	// Delete existing sections for this evaluation and re-insert
	const { error: deleteError } = await supabase
		.from('evaluation_sections')
		.delete()
		.eq('evaluation_id', evaluationId);

	if (deleteError) {
		console.error('[saveSections] Delete error:', deleteError);
		throw error(500, 'Failed to clear sections');
	}

	if (sections.length === 0) return { success: true };

	const rows = sections.map((s) => ({
		evaluation_id: evaluationId,
		section_key: s.sectionKey,
		rating: s.rating ?? null,
		notes: s.notes ?? null
	}));

	const { error: insertError } = await supabase.from('evaluation_sections').insert(rows);

	if (insertError) {
		console.error('[saveSections] Insert error:', insertError);
		throw error(500, 'Failed to save sections');
	}

	return { success: true };
});

// ============================================================
// SAVE: Check Items (upsert - batch)
// ============================================================

const saveCheckItemsSchema = z.object({
	evaluationId: z.number().int().positive(),
	checkItems: z.array(
		z.object({
			sectionKey: z.string().min(1),
			itemKey: z.string().min(1),
			checked: z.boolean().default(false),
			valueText: z.string().optional(),
			valueNumeric: z.number().optional(),
			notes: z.string().optional()
		})
	)
});

export const saveCheckItems = command(
	saveCheckItemsSchema,
	async ({ evaluationId, checkItems }) => {
		const supabase = createServerClient();
		const profile = await getUserProfileWithRoleCheck([3]);

		await verifyEvaluationOwnership(supabase, evaluationId, profile.id);

		// Delete existing and re-insert
		const { error: deleteError } = await supabase
			.from('evaluation_check_items')
			.delete()
			.eq('evaluation_id', evaluationId);

		if (deleteError) {
			console.error('[saveCheckItems] Delete error:', deleteError);
			throw error(500, 'Failed to clear check items');
		}

		if (checkItems.length === 0) return { success: true };

		const rows = checkItems.map((item) => ({
			evaluation_id: evaluationId,
			section_key: item.sectionKey,
			item_key: item.itemKey,
			checked: item.checked,
			value_text: item.valueText ?? null,
			value_numeric: item.valueNumeric ?? null,
			notes: item.notes ?? null
		}));

		const { error: insertError } = await supabase.from('evaluation_check_items').insert(rows);

		if (insertError) {
			console.error('[saveCheckItems] Insert error:', insertError);
			throw error(500, 'Failed to save check items');
		}

		return { success: true };
	}
);

// ============================================================
// SAVE: Machine Data (upsert - batch)
// ============================================================

const saveMachineDataSchema = z.object({
	evaluationId: z.number().int().positive(),
	machineData: z.array(
		z.object({
			equipmentId: z.number().int().positive().optional(),
			checked: z.boolean().default(false),
			valueText: z.string().optional(),
			valueNumeric: z.number().optional(),
			notes: z.string().optional()
		})
	)
});

export const saveMachineData = command(
	saveMachineDataSchema,
	async ({ evaluationId, machineData }) => {
		const supabase = createServerClient();
		const profile = await getUserProfileWithRoleCheck([3]);

		await verifyEvaluationOwnership(supabase, evaluationId, profile.id);

		const { error: deleteError } = await supabase
			.from('evaluation_machine_data')
			.delete()
			.eq('evaluation_id', evaluationId);

		if (deleteError) {
			console.error('[saveMachineData] Delete error:', deleteError);
			throw error(500, 'Failed to clear machine data');
		}

		if (machineData.length === 0) return { success: true };

		const rows = machineData.map((m) => ({
			evaluation_id: evaluationId,
			equipment_id: m.equipmentId ?? null,
			checked: m.checked,
			value_text: m.valueText ?? null,
			value_numeric: m.valueNumeric ?? null,
			notes: m.notes ?? null
		}));

		const { error: insertError } = await supabase.from('evaluation_machine_data').insert(rows);

		if (insertError) {
			console.error('[saveMachineData] Insert error:', insertError);
			throw error(500, 'Failed to save machine data');
		}

		return { success: true };
	}
);

// ============================================================
// SAVE: Action Items (upsert - batch)
// ============================================================

const saveActionItemsSchema = z.object({
	evaluationId: z.number().int().positive(),
	actionItems: z.array(
		z.object({
			category: z.enum(['equipment', 'technical_service', 'training', 'general']),
			description: z.string().min(1),
			priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
		})
	)
});

export const saveActionItems = command(
	saveActionItemsSchema,
	async ({ evaluationId, actionItems }) => {
		const supabase = createServerClient();
		const profile = await getUserProfileWithRoleCheck([3]);

		await verifyEvaluationOwnership(supabase, evaluationId, profile.id);

		// Delete only unresolved action items (keep resolved ones intact)
		const { error: deleteError } = await supabase
			.from('evaluation_action_items')
			.delete()
			.eq('evaluation_id', evaluationId)
			.eq('resolved', false);

		if (deleteError) {
			console.error('[saveActionItems] Delete error:', deleteError);
			throw error(500, 'Failed to clear action items');
		}

		if (actionItems.length === 0) return { success: true };

		const rows = actionItems.map((item) => ({
			evaluation_id: evaluationId,
			category: item.category,
			description: item.description,
			priority: item.priority
		}));

		const { error: insertError } = await supabase.from('evaluation_action_items').insert(rows);

		if (insertError) {
			console.error('[saveActionItems] Insert error:', insertError);
			throw error(500, 'Failed to save action items');
		}

		return { success: true };
	}
);

// ============================================================
// SAVE: Water Filter Data (upsert - single record per evaluation)
// ============================================================

const saveWaterFilterSchema = z.object({
	evaluationId: z.number().int().positive(),
	lastChangeDate: z.string().date().optional(),
	filterType: z.string().optional(),
	supplier: z.string().optional(),
	needsReplacement: z.boolean().default(false)
});

export const saveWaterFilter = command(
	saveWaterFilterSchema,
	async ({ evaluationId, lastChangeDate, filterType, supplier, needsReplacement }) => {
		const supabase = createServerClient();
		const profile = await getUserProfileWithRoleCheck([3]);

		await verifyEvaluationOwnership(supabase, evaluationId, profile.id);

		// Check if record exists
		const { data: existing } = await supabase
			.from('evaluation_water_filter')
			.select('id')
			.eq('evaluation_id', evaluationId)
			.maybeSingle();

		const waterData = {
			evaluation_id: evaluationId,
			last_change_date: lastChangeDate ?? null,
			filter_type: filterType ?? null,
			supplier: supplier ?? null,
			needs_replacement: needsReplacement
		};

		if (existing) {
			const { error: updateError } = await supabase
				.from('evaluation_water_filter')
				.update(waterData)
				.eq('id', existing.id);

			if (updateError) {
				console.error('[saveWaterFilter] Update error:', updateError);
				throw error(500, 'Failed to update water filter data');
			}
		} else {
			const { error: insertError } = await supabase
				.from('evaluation_water_filter')
				.insert(waterData);

			if (insertError) {
				console.error('[saveWaterFilter] Insert error:', insertError);
				throw error(500, 'Failed to save water filter data');
			}
		}

		return { success: true };
	}
);

// ============================================================
// PHOTOS: Upload, list, delete
// ============================================================

const uploadPhotoSchema = z.object({
	evaluationId: z.number().int().positive(),
	sectionKey: z.string().min(1),
	photoLabel: z.string().optional(),
	caption: z.string().optional(),
	displayOrder: z.number().int().default(0),
	// File will be handled separately via FormData
	fileName: z.string().min(1),
	fileBase64: z.string().min(1),
	fileType: z.string().min(1)
});

export const uploadEvaluationPhoto = command(
	uploadPhotoSchema,
	async ({
		evaluationId,
		sectionKey,
		photoLabel,
		caption,
		displayOrder,
		fileName,
		fileBase64,
		fileType
	}) => {
		const supabase = createServerClient();
		const profile = await getUserProfileWithRoleCheck([3]);

		await verifyEvaluationOwnership(supabase, evaluationId, profile.id);

		// Decode base64 to buffer
		const buffer = Buffer.from(fileBase64, 'base64');

		// Validate file size (5MB max)
		if (buffer.byteLength > 5 * 1024 * 1024) {
			throw error(400, 'Photo exceeds 5MB limit');
		}

		// Generate unique path
		const timestamp = Date.now();
		const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
		const storagePath = `evaluation-${evaluationId}/${sectionKey}/${timestamp}-${safeName}`;

		// Upload to storage
		const { error: uploadError } = await supabase.storage
			.from('evaluation-photos')
			.upload(storagePath, buffer, {
				contentType: fileType,
				upsert: false
			});

		if (uploadError) {
			console.error('[uploadEvaluationPhoto] Storage error:', uploadError);
			throw error(500, 'Failed to upload photo');
		}

		// Get the signed URL (private bucket)
		const { data: signedUrlData } = await supabase.storage
			.from('evaluation-photos')
			.createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

		const photoUrl = signedUrlData?.signedUrl ?? storagePath;

		// Insert record
		const { data: photo, error: insertError } = await supabase
			.from('evaluation_photos')
			.insert({
				evaluation_id: evaluationId,
				section_key: sectionKey,
				photo_url: photoUrl,
				photo_label: photoLabel ?? null,
				caption: caption ?? null,
				display_order: displayOrder
			})
			.select('id, photo_url')
			.single();

		if (insertError) {
			console.error('[uploadEvaluationPhoto] Insert error:', insertError);
			throw error(500, 'Failed to save photo record');
		}

		return { success: true, photo };
	}
);

const deletePhotoSchema = z.object({
	photoId: z.number().int().positive(),
	evaluationId: z.number().int().positive()
});

export const deleteEvaluationPhoto = command(
	deletePhotoSchema,
	async ({ photoId, evaluationId }) => {
		const supabase = createServerClient();
		const profile = await getUserProfileWithRoleCheck([3]);

		await verifyEvaluationOwnership(supabase, evaluationId, profile.id);

		// Get photo URL for storage deletion
		const { data: photo } = await supabase
			.from('evaluation_photos')
			.select('id, photo_url')
			.eq('id', photoId)
			.eq('evaluation_id', evaluationId)
			.single();

		if (!photo) {
			throw error(404, 'Photo not found');
		}

		// Delete from storage (extract path from signed URL or use directly)
		// The photo_url might be a signed URL or a path
		try {
			const url = new URL(photo.photo_url);
			const pathMatch = url.pathname.match(/evaluation-photos\/(.+)/);
			if (pathMatch) {
				await supabase.storage.from('evaluation-photos').remove([pathMatch[1]]);
			}
		} catch {
			// If not a URL, try as direct path
			await supabase.storage.from('evaluation-photos').remove([photo.photo_url]);
		}

		// Delete record
		const { error: deleteError } = await supabase
			.from('evaluation_photos')
			.delete()
			.eq('id', photoId);

		if (deleteError) {
			console.error('[deleteEvaluationPhoto] Error:', deleteError);
			throw error(500, 'Failed to delete photo');
		}

		return { success: true };
	}
);

// ============================================================
// SUBMIT: Finalize evaluation
// ============================================================

const submitEvaluationSchema = z.object({
	evaluationId: z.number().int().positive()
});

export const submitEvaluation = command(submitEvaluationSchema, async ({ evaluationId }) => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	// Verify ownership
	const { data: evaluation } = await supabase
		.from('store_evaluations')
		.select('id, status, overall_rating')
		.eq('id', evaluationId)
		.eq('trainer_id', profile.id)
		.single();

	if (!evaluation) {
		throw error(404, 'Evaluation not found');
	}

	if (evaluation.status !== 'draft' && evaluation.status !== 'reopened') {
		throw error(400, `Cannot submit evaluation with status: ${evaluation.status}`);
	}

	// Optional: require an overall_rating before submit
	if (!evaluation.overall_rating) {
		throw error(400, 'Please provide an overall rating before submitting');
	}

	const { error: updateError } = await supabase
		.from('store_evaluations')
		.update({
			status: 'submitted',
			submitted_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		})
		.eq('id', evaluationId);

	if (updateError) {
		console.error('[submitEvaluation] Error:', updateError);
		throw error(500, 'Failed to submit evaluation');
	}

	return { success: true };
});

// ============================================================
// DELETE: Delete a draft evaluation
// ============================================================

const deleteEvaluationSchema = z.object({
	evaluationId: z.number().int().positive()
});

export const deleteEvaluation = command(deleteEvaluationSchema, async ({ evaluationId }) => {
	const supabase = createServerClient();

	const { data: evaluation } = await supabase
		.from('store_evaluations')
		.select('id, submit')
		.eq('id', evaluationId)
		.single();

	if (!evaluation) {
		throw error(404, 'Evaluation not found');
	}

	// Delete photos from storage
	const { data: photos } = await supabase
		.from('evaluation_photos')
		.select('photo_url')
		.eq('evaluation_id', evaluationId);

	if (photos && photos.length > 0) {
		const paths = photos
			.map((p) => {
				try {
					const url = new URL(p.photo_url);
					const match = url.pathname.match(/evaluation-photos\/(.+)/);
					return match ? match[1] : p.photo_url;
				} catch {
					return p.photo_url;
				}
			})
			.filter(Boolean);

		if (paths.length > 0) {
			await supabase.storage.from('evaluation-photos').remove(paths);
		}
	}

	// Delete evaluation
	const { error: deleteError } = await supabase
		.from('store_evaluations')
		.delete()
		.eq('id', evaluationId);

	if (deleteError) {
		console.error('[deleteEvaluation] Error:', deleteError);
		throw error(500, 'Failed to delete evaluation');
	}

	return { success: true };
});

// ============================================================
// HELPER: Verify evaluation ownership & editable status
// ============================================================

async function verifyEvaluationOwnership(
	supabase: ReturnType<typeof createServerClient>,
	evaluationId: number,
	trainerId: string
) {
	const { data: evaluation, error: evalError } = await supabase
		.from('store_evaluations')
		.select('id, status, trainer_id')
		.eq('id', evaluationId)
		.single();

	if (evalError || !evaluation) {
		throw error(404, 'Evaluation not found');
	}

	if (evaluation.trainer_id !== trainerId) {
		throw error(403, 'You do not own this evaluation');
	}

	if (evaluation.status !== 'draft' && evaluation.status !== 'reopened') {
		throw error(400, `Cannot edit evaluation with status: ${evaluation.status}`);
	}

	return evaluation;
}

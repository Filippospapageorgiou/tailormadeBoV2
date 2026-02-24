import { query, command } from '$app/server';
import { createAdminClient, createServerClient } from '$lib/supabase/server';
import { getProfileByUUId, getUserProfile, getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import type { Equipment } from '$lib/models/equipment.types';
import type { Profile } from '$lib/models/database.types';

// ============================================================
// AUTH - Trainer access (role_id = 3)
// ============================================================

const profileIdSchema = z.object({
	id: z.string()
});

export const getprofileByUUID = query(profileIdSchema, async({ id })=> {
	try{
		let profile = await getProfileByUUId(id);
		return {
			success: true,
			profile: profile
		};
	}catch(err){
		console.error('[getprofileByUUID] error fetching user profile: ',err);
		return{
			success:false,
			profile:null,
		}
	}
})

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
		.select('*')
		.eq('org_id', orgId)
		.order('full_name', { ascending: true })
		.overrideTypes<Profile[]>();

	if (staffError) {
		console.error('[getOrgStaff] Error:', staffError);
		throw error(500, 'Failed to fetch staff');
	}

	return staff ?? [];
});


// ============================================================
// CREATE: Start a new evaluation (draft)
// ============================================================

const createEvaluationSchema = z.object({
	orgId: z.number().int().positive(),
	visitDate: z.string(),
	storeManagers: z.array(z.string()).default([]),
	baristasOnDuty: z.array(z.string()).default([]),
	submit: z.string(), // 'draft' | 'submitted'
	overall_rating:z.number()
});

export const createEvaluation = command(
	createEvaluationSchema,
	async ({ orgId, visitDate, storeManagers, baristasOnDuty, submit,overall_rating }) => {
		const supabase = createServerClient();
		const profile = await getUserProfileWithRoleCheck([3]);

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
				submit,
				overall_rating
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
// SAVE: Section checklist items (cleanliness / knowledge / training)
// ============================================================

const saveSectionItemsSchema = z.object({
	evaluation_id: z.number().int().positive(),
	items: z.array(z.object({
		section: z.string(),
		item_key: z.string(),
		item_label: z.string(),
		checked: z.boolean(),
		score: z.number().nullable().optional(),
		notes: z.string().nullable().optional(),
	})),
});

export const saveSectionItems = command(saveSectionItemsSchema, async ({ evaluation_id, items }) => {
	const supabase = createServerClient();

	const rows = items.map((item) => ({
		evaluation_id,
		section: item.section,
		item_key: item.item_key,
		item_label: item.item_label,
		checked: item.checked,
		score: item.score ?? null,
		notes: item.notes ?? null,
	}));

	const { error: insertError } = await supabase
		.from('evaluation_section_items')
		.insert(rows);

	if (insertError) {
		console.error('[saveSectionItems] Error:', insertError);
		throw error(500, 'Failed to save section items');
	}

	return { success: true, count: rows.length };
});

// ============================================================
// SAVE: Barista training block (unique per evaluation)
// ============================================================

const saveBaristaTrainingSchema = z.object({
	evaluation_id: z.number().int().positive(),
	barista_name: z.string().nullable().optional(),
	score: z.number().nullable().optional(),
	needs_followup: z.boolean(),
	followup_date: z.string().nullable().optional(),
	other_training: z.string().nullable().optional(),
});

export const saveBaristaTraining = command(saveBaristaTrainingSchema, async ({
	evaluation_id, barista_name, score, needs_followup, followup_date, other_training
}) => {
	const supabase = createServerClient();

	const { error: insertError } = await supabase
		.from('evaluation_barista_training')
		.insert({
			evaluation_id,
			barista_name: barista_name ?? null,
			score: score ?? null,
			needs_followup,
			followup_date: followup_date ?? null,
			other_training: other_training ?? null,
		});

	if (insertError) {
		console.error('[saveBaristaTraining] Error:', insertError);
		throw error(500, 'Failed to save barista training');
	}

	return { success: true };
});

// ============================================================
// SAVE: Equipment evaluations + check items
// ============================================================

const saveEquipmentsSchema = z.object({
	evaluation_id: z.number().int().positive(),
	equipments: z.array(z.object({
		equipment_id: z.number().nullable().optional(),
		score: z.number().nullable().optional(),
		notes: z.string().nullable().optional(),
		checkItems: z.array(z.object({
			check_name: z.string(),
			value_numeric: z.number().nullable().optional(),
			passed: z.boolean().nullable().optional(),
			notes: z.string().nullable().optional(),
		})).default([]),
	})),
});

export const saveEquipments = command(saveEquipmentsSchema, async ({ evaluation_id, equipments }) => {
	const supabase = createServerClient();

	for (const eq of equipments) {
		// Insert equipment evaluation row, get back its id
		const { data: evalRow, error: evalError } = await supabase
			.from('equipment_evaluations')
			.insert({
				evaluation_id,
				equipment_id: eq.equipment_id ?? null,
				score: eq.score ?? null,
				notes: eq.notes ?? null,
			})
			.select('id')
			.single();

		if (evalError) {
			console.error('[saveEquipments] Error inserting equipment eval:', evalError);
			throw error(500, 'Failed to save equipment evaluation');
		}

		// Bulk insert check items for this equipment
		if (eq.checkItems.length > 0) {
			const checkRows = eq.checkItems.map((ci) => ({
				equipment_eval_id: evalRow.id,
				check_name: ci.check_name,
				value_numeric: ci.value_numeric ?? null,
				passed: ci.passed ?? null,
				notes: ci.notes ?? null,
			}));

			const { error: checkError } = await supabase
				.from('equipment_check_items')
				.insert(checkRows);

			if (checkError) {
				console.error('[saveEquipments] Error inserting check items:', checkError);
				throw error(500, 'Failed to save equipment check items');
			}
		}
	}

	return { success: true };
});

// ============================================================
// SAVE: Final summary & action points
// ============================================================

const saveSummarySchema = z.object({
	evaluation_id: z.number().int().positive(),
	score: z.number(),
	comments: z.string(),
	sections: z.array(z.object({
		label: z.string(),
		description: z.string(),
		priority: z.number(),
	})).default([]),
});

export const saveSummary = command(saveSummarySchema, async ({ evaluation_id, score, comments, sections }) => {
	const supabase = createServerClient();

	const { error: insertError } = await supabase
		.from('evaluation_summary_actions')
		.insert({
			evaluation_id: evaluation_id,
			score,
			comments,
			sections,
		});

	if (insertError) {
		console.error('[saveSummary] Error:', insertError);
		throw error(500, 'Failed to save evaluation summary');
	}

	return { success: true };
});

// ============================================================
// LOAD: Full evaluation with all child data (for editing)
// ============================================================


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
// SAVE: Evaluation photos metadata (after client-side upload)
// ============================================================

const savePhotosSchema = z.object({
	evaluation_id: z.number().int().positive(),
	photos: z.array(z.object({
		category: z.string(),
		storage_path: z.string(),
		description: z.string().nullable().optional(),
	})),
});

export const savePhotos = command(savePhotosSchema, async ({ evaluation_id, photos }) => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	const { error: insertError } = await supabase
		.from('evaluation_photos')
		.insert({
			evaluation_id,
			photos,
			uploaded_by: profile.id,
		});

	if (insertError) {
		console.error('[savePhotos] Error:', insertError);
		throw error(500, 'Failed to save photo records');
	}

	return { success: true };
});

// ============================================================
// SUBMIT: Finalize evaluation, delete assignment, notify assigner
// ============================================================

const submitEvaluationFinalSchema = z.object({
	evaluationId: z.number().int().positive(),
});

export const submitEvaluationFinal = command(submitEvaluationFinalSchema, async ({ evaluationId }) => {
	const supabase = createAdminClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	// Fetch the evaluation (verify ownership)
	const { data: evaluation } = await supabase
		.from('store_evaluations')
		.select('id, org_id, trainer_id, visit_date, submit')
		.eq('id', evaluationId)
		.eq('trainer_id', profile.id)
		.single();

	if (!evaluation) throw error(404, 'Evaluation not found');
	if (evaluation.submit === 'submitted') throw error(400, 'Already submitted');

	// Mark as submitted
	const { error: updateError } = await supabase
		.from('store_evaluations')
		.update({ submit: 'submitted', submitted_at: new Date().toLocaleString('en-US', { timeZone: 'Europe/Athens' })})
		.eq('id', evaluationId);

	if (updateError) {
		console.error('[submitEvaluationFinal] Update error:', updateError);
		throw error(500, 'Failed to submit evaluation');
	}

	// Find the active assignment for this trainer+org
	const { data: assignment } = await supabase
		.from('trainer_org_assigments')
		.select('id, assigned_by')
		.eq('trainer_id', profile.id)
		.eq('org_id', evaluation.org_id)
		.maybeSingle();

	if (assignment) {
		// Delete the assignment
		await supabase.from('trainer_org_assigments').delete().eq('id', assignment.id);

		// Fetch assigner profile for email
		const { data: assigner } = await supabase
			.from('profiles')
			.select('email, full_name, username')
			.eq('id', assignment.assigned_by)
			.single();

		// Fetch org info
		const { data: org } = await supabase
			.from('core_organizations')
			.select('store_name, location')
			.eq('id', evaluation.org_id)
			.single();

		if (assigner?.email && org) {
			const { sendEvaluationCompletionNotification } = await import(
				'$lib/emails/evaluation-completion-notification'
			);
			await sendEvaluationCompletionNotification({
				recipientEmail: assigner.email,
				recipientName: assigner.full_name ?? assigner.username ?? 'Διαχειριστής',
				trainerName: profile.full_name ?? profile.username ?? 'Trainer',
				storeName: org.store_name,
				storeLocation: org.location ?? undefined,
				visitDate: evaluation.visit_date,
				evaluationId,
			});
		}
	}

	return { success: true };
});

// ============================================================
// HELPER: Verify evaluation ownership & editable status
// ============================================================


// ============================================================
// LOAD: Full evaluation detail (all related tables)
// ============================================================

const getEvaluationByIdSchema = z.object({
	evaluationId: z.number().int().positive()
});

export const getEvaluationById = query(getEvaluationByIdSchema, async ({ evaluationId }) => {
	const supabase = createAdminClient();

	const { data: evaluation, error: evalError } = await supabase
		.from('store_evaluations')
		.select(`
			*,
			core_organizations!store_evaluations_org_id_fkey (*),
			trainer:profiles!store_evaluations_trainer_id_fkey (id, full_name, email, image_url, username),
			evaluation_section_items (*),
			evaluation_barista_training (*),
			equipment_evaluations (
				*,
				equipment (id, name, model,image_url),
				equipment_check_items (*)
			),
			evaluation_photos (*),
			evaluation_summary_actions (*)
		`)
		.eq('id', evaluationId)
		.single();

	if (evalError || !evaluation) {
		console.error('[getEvaluationById] Error:', evalError);
		throw error(404, 'Evaluation not found');
	}

	// Fetch staff profiles for store managers and baristas
	const allStaffIds = [
		...(evaluation.store_managers ?? []),
		...(evaluation.baristas_on_duty ?? []),
	].filter(Boolean) as string[];

	let staffProfiles: { id: string; full_name: string; image_url: string | null }[] = [];
	if (allStaffIds.length > 0) {
		const { data: staff } = await supabase
			.from('profiles')
			.select('id, full_name, image_url')
			.in('id', allStaffIds);
		staffProfiles = staff ?? [];
	}

	// Generate signed URLs (1h) — bucket is private so getPublicUrl won't work
	const photosRow = (evaluation.evaluation_photos as any[])?.[0] ?? null;
	const rawPhotos: any[] = photosRow?.photos ?? [];
	const photoItemsWithUrls = await Promise.all(
		rawPhotos.map(async (p: any) => {
			const { data: signed } = await supabase.storage
				.from('evaluation-photos')
				.createSignedUrl(p.storage_path, 3600);
			return { ...p, url: signed?.signedUrl ?? '' };
		})
	);

	return {
		evaluation: evaluation as any,
		staffProfiles,
		photoItemsWithUrls,
	};
});

// ============================================================

const orgIdEquipment = z.object({
	orgId: z.number().positive().int()
});

export const getAllOrgEquipments = query(orgIdEquipment, async ({ orgId }) => {
	const supabase = createAdminClient();
	try {
		const { data: equipments, error } = await supabase
			.from('equipment')
			.select('*')
			.eq('org_id',orgId)
			.overrideTypes<Equipment[]>();
		if (error) {
			console.error('Error fetching equipments: ', error);
			return {
				success: false,
				total: 0,
				message: 'Error fetching equipments',
				equipments: []
			};
		}

		return {
			success: true,
			total: equipments.length || 0,
			message: 'Equipments fetched successfully',
			equipments
		};
	} catch (error) {
		console.error('Error fetching equipments: ', error);
		return {
			success: false,
			message: 'Error fetching equipments',
			equipments: []
		};
	}
});
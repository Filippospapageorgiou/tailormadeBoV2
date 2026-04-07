import { form, command, query } from '$app/server';
import { z } from 'zod/v4';
import { createServerClient, createAdminClient } from '$lib/supabase/server';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { optimizeImage } from '$lib/image';
import {
	sendVisitCompletionNotification,
	sendIssueResolvedNotification
} from '$lib/emails/equipment-notifications';
import type {
	EquipmentWithLogCount,
	MaintenanceLogWithUser,
	TrainerServiceVisit,
	TrainerServiceVisitWithActions
} from '$lib/models/equipment.types';

// ============================================================
// AUTH
// ============================================================

export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([3]); // trainer only
	return { profile };
});

// ============================================================
// QUERIES
// ============================================================

/**
 * Get ALL organizations with their equipment, counts, and overdue info
 * No org restrictions — trainers can see everything for urgent cases
 */
export const getAllOrgsWithEquipment = query(async () => {
	const supabase = createAdminClient(); // bypass RLS — trainers need cross-org equipment access
	const profile = await getUserProfileWithRoleCheck([3]);

	// Get all organizations
	const { data: orgs, error: orgError } = await supabase
		.from('core_organizations')
		.select('id, store_name, location, phone')
		.order('store_name', { ascending: true });

	if (orgError) {
		console.error('[getAllOrgsWithEquipment] Org error:', orgError);
		return { success: false, orgs: [] };
	}

	if (!orgs || orgs.length === 0) {
		return { success: true, orgs: [] };
	}

	const orgIds = orgs.map((o) => o.id);

	// Get all equipment with maintenance log counts
	const { data: equipments, error: eqError } = await supabase
		.from('equipment')
		.select('*, maintenance_logs(count)')
		.in('org_id', orgIds)
		.overrideTypes<EquipmentWithLogCount[]>();

	if (eqError) {
		console.error('[getAllOrgsWithEquipment] Equipment error:', eqError);
		return { success: false, orgs: [] };
	}

	// Get trainer's assigned org ids (to mark which are assigned)
	const { data: assignments } = await supabase
		.from('trainer_org_assigments')
		.select('org_id')
		.eq('trainer_id', profile.id)
		.eq('is_active', true);

	const assignedOrgIds = new Set((assignments || []).map((a: any) => a.org_id));

	// Get last trainer visit per org
	const { data: lastVisits } = await supabase
		.from('trainer_service_visits')
		.select('org_id, visit_date, status')
		.eq('trainer_id', profile.id)
		.in('org_id', orgIds)
		.order('visit_date', { ascending: false });

	// Build org data with equipment grouped
	const today = new Date().toISOString().split('T')[0];
	const result = orgs.map((org) => {
		const orgEquipments = (equipments || [])
			.filter((e) => e.org_id === org.id)
			.map((e) => ({
				...e,
				image_url: optimizeImage(e.image_url, 400, 75)
			}));

		const overdueCount = orgEquipments.filter(
			(e) => e.next_service_date && e.next_service_date < today
		).length;
		const brokenCount = orgEquipments.filter((e) => e.status === 'broken').length;
		const maintenanceCount = orgEquipments.filter((e) => e.status === 'maintenance').length;
		const operationalCount = orgEquipments.filter((e) => e.status === 'operational').length;

		const lastVisit = (lastVisits || []).find((v: any) => v.org_id === org.id);

		return {
			org_id: org.id,
			org,
			isAssigned: assignedOrgIds.has(org.id),
			equipments: orgEquipments,
			counts: {
				total: orgEquipments.length,
				overdue: overdueCount,
				broken: brokenCount,
				maintenance: maintenanceCount,
				operational: operationalCount
			},
			lastVisitDate: lastVisit?.visit_date || null,
			lastVisitStatus: lastVisit?.status || null
		};
	});

	return { success: true, orgs: result };
});

/**
 * Get maintenance logs for a specific equipment
 */
const getLogsSchema = z.object({
	equipmentId: z.number().int().positive()
});

export const getMaintenanceLogs = query(getLogsSchema, async ({ equipmentId }) => {
	const supabase = createAdminClient(); // bypass RLS — cross-org equipment access

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
		.eq('equipment_id', equipmentId)
		.order('created_at', { ascending: false })
		.overrideTypes<MaintenanceLogWithUser[]>();

	if (error) {
		console.error('[getMaintenanceLogs] Error:', error);
		return { success: false, logs: [] };
	}

	return { success: true, logs: logs || [] };
});

/**
 * @function
 * @returns all maintance logs count of all orgs
 */
export const getAllMaintenanceLogs = query(async () => {
	const supabase = createAdminClient();

	// Correctly destructure 'count' instead of renaming 'data'
	// Remove .single() to avoid PostgREST errors on multiple rows
	const { error, count } = await supabase
		.from('maintenance_logs')
		.select('*', { count: 'exact', head: true })
		.in('status', ['open', 'progress']); // Fixed 'proggress' typo

	if (error) {
		console.error('[getMaintenanceLogs] Error:', error);
		// Returning 0 instead of [] to keep the type consistent
		return { success: false, count: 0 };
	}

	console.log(count);

	// Use ?? so that if count is 0, it returns 0 instead of []
	return { success: true, count: count ?? 0 };
});

/**
 * Get recent issues across ALL organizations
 */
export const getRecentIssues = query(async () => {
	const supabase = createAdminClient(); // bypass RLS — cross-org access
	await getUserProfileWithRoleCheck([3]);

	const { data: logs, error } = await supabase
		.from('maintenance_logs')
		.select(
			`
			*,
			profiles!maintenance_logs_user_id_fkey (
				username,
				role,
				image_url
			),
			equipment!maintenance_logs_equipment_id_fkey (
				name,
				model,
				org_id,
				core_organizations!equipment_org_id_fkey (
					store_name,
					location
				)
			)
		`
		)
		.eq('is_emergency', false)
		.in('status', ['open', 'progress'])
		.order('created_at', { ascending: false })
		.limit(30);

	if (error) {
		console.error('[getRecentIssues] Error:', error);
		return { success: false, issues: [] };
	}

	return { success: true, issues: logs || [] };
});

/**
 * Get visit history for current trainer
 */
export const getMyVisits = query(async () => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	const { data: visits, error } = await supabase
		.from('trainer_service_visits')
		.select(
			`
			*,
			core_organizations (
				id, store_name, location
			),
			profiles!trainer_service_visits_trainer_id_fkey (
				id, username, full_name, email, image_url
			),
			trainer_visit_actions (
				*,
				equipment (
					id, name, model, image_url
				)
			)
		`
		)
		.eq('trainer_id', profile.id)
		.order('visit_date', { ascending: false })
		.limit(20)
		.overrideTypes<TrainerServiceVisitWithActions[]>();

	if (error) {
		console.error('[getMyVisits] Error:', error);
		return { success: false, visits: [] };
	}

	// Enrich with computed fields
	const enriched = (visits || []).map((v: any) => ({
		...v,
		action_count: v.trainer_visit_actions?.length ?? 0,
		total_cost: (v.trainer_visit_actions || []).reduce(
			(sum: number, a: any) => sum + (a.cost || 0),
			0
		)
	}));

	return { success: true, visits: enriched };
});

// ============================================================
// COMMANDS (mutations)
// ============================================================

/**
 * Start a new service visit — can be for ANY org
 */
const startVisitSchema = z.object({
	orgId: z.number().int().positive(),
	notes: z.string().optional()
});

export const startVisit = command(startVisitSchema, async ({ orgId, notes }) => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	const { data: visit, error } = await supabase
		.from('trainer_service_visits')
		.insert({
			trainer_id: profile.id,
			org_id: orgId,
			visit_date: new Date().toISOString().split('T')[0],
			status: 'in_progress',
			notes: notes || null
		})
		.select()
		.single<TrainerServiceVisit>();

	if (error) {
		console.error('[startVisit] Error:', error);
		return { success: false, visit: null, message: 'Σφάλμα κατά τη δημιουργία επίσκεψης' };
	}

	return { success: true, visit };
});

async function deleteVisistImages(
	supabase: ReturnType<typeof createAdminClient>,
	images: string[]
) {
	if (!images || images.length === 0) return;

	// Extract storage paths from full URLs
	const paths = images
		.map((url) => {
			const match = url.match(/trainer-visit-images\/(.+)/);
			return match ? match[1] : null;
		})
		.filter(Boolean) as string[];

	if (paths.length === 0) return;

	const { error } = await supabase.storage.from('trainer-visit-images').remove(paths);

	if (error) {
		console.error('[deleteVisitImages] Storage error:', error);
	}
}

/**
 * Add an action to an active visit
 */
const addActionSchema = z.object({
	visitId: z.number().int().positive(),
	equipmentId: z.number().int().positive(),
	actionType: z.string(),
	description: z.string().min(1),
	images: z.array(z.string()).optional(),
	cost: z.number().min(0).optional(),
	statusChange: z.enum(['operational', 'maintenance', 'broken']).nullable().optional(),
	nextServiceDate: z.string().nullable().optional(),
	previousServiceDate: z.string().nullable().optional()
});

export const addVisitAction = command(
	addActionSchema,
	async ({
		visitId,
		equipmentId,
		actionType,
		description,
		images,
		cost,
		statusChange,
		nextServiceDate,
		previousServiceDate
	}) => {
		const supabase = createAdminClient(); // need admin for cross-org equipment update
		await getUserProfileWithRoleCheck([3]);

		const { data: action, error } = await supabase
			.from('trainer_visit_actions')
			.insert({
				visit_id: visitId,
				equipment_id: equipmentId,
				action_type: actionType,
				description,
				images: images || null,
				cost: cost || 0,
				status_change: statusChange || null,
				next_service_date: nextServiceDate || null,
				last_service_date: previousServiceDate || null
			})
			.select()
			.single();

		if (error) {
			console.error('[addVisitAction] Error:', error);
			return { success: false, action: null, message: 'Σφάλμα κατά την προσθήκη ενέργειας' };
		}

		// If status or service date changed, update the equipment too
		if (statusChange || nextServiceDate) {
			const updateData: Record<string, any> = {};
			if (statusChange) updateData.status = statusChange;
			if (previousServiceDate) updateData.last_service_date = previousServiceDate;
			if (nextServiceDate) updateData.next_service_date = nextServiceDate;
			console.log(updateData);
			const { error: eqError } = await supabase
				.from('equipment')
				.update(updateData)
				.eq('id', equipmentId);

			if (eqError) {
				console.error('[addVisitAction] Equipment update error:', eqError);
			}
		}

		return { success: true, action };
	}
);

/**
 * Update equipment status (optional, after adding actions)
 */
const updateEquipmentStatusSchema = z.object({
	equipmentId: z.number().int().positive(),
	status: z.enum(['operational', 'maintenance', 'broken']),
	nextServiceDate: z.string().nullable().optional(),
	updateLastServiceDate: z.boolean().optional()
});

export const updateEquipmentStatus = command(
	updateEquipmentStatusSchema,
	async ({ equipmentId, status, nextServiceDate, updateLastServiceDate }) => {
		const supabase = createAdminClient(); // bypass RLS — trainers update cross-org equipment
		await getUserProfileWithRoleCheck([3]);

		const updateData: Record<string, any> = { status };

		if (nextServiceDate) {
			updateData.next_service_date = nextServiceDate;
		}

		if (updateLastServiceDate) {
			updateData.last_service_date = new Date().toISOString().split('T')[0];
		}

		const { error } = await supabase.from('equipment').update(updateData).eq('id', equipmentId);

		if (error) {
			console.error('[updateEquipmentStatus] Error:', error);
			return { success: false, message: 'Σφάλμα κατά την ενημέρωση κατάστασης' };
		}

		return { success: true };
	}
);

/**
 * Complete a visit
 */
const completeVisitSchema = z.object({
	visitId: z.number().int().positive(),
	notes: z.string().optional()
});

export const completeVisit = command(completeVisitSchema, async ({ visitId, notes }) => {
	const supabase = createServerClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	const updateData: Record<string, any> = {
		status: 'completed',
		completed_at: new Date().toISOString()
	};

	if (notes !== undefined) {
		updateData.notes = notes;
	}

	const { error } = await supabase
		.from('trainer_service_visits')
		.update(updateData)
		.eq('id', visitId)
		.eq('trainer_id', profile.id);

	if (error) {
		console.error('[completeVisit] Error:', error);
		return { success: false, message: 'Σφάλμα κατά την ολοκλήρωση επίσκεψης' };
	}

	// Send email notification to super admins (fire-and-forget)
	sendVisitCompletionNotification(visitId, profile.id).catch((err) =>
		console.error('[completeVisit] Email notification error:', err)
	);

	return { success: true };
});

/**
 * Delete a visit action
 */
const deleteActionSchema = z.object({
	actionId: z.number().int().positive()
});

/**
 * Delete a visit action and its images
 */
export const deleteVisitAction = command(deleteActionSchema, async ({ actionId }) => {
	const supabase = createAdminClient(); // need admin for storage access
	await getUserProfileWithRoleCheck([3]);

	// Fetch the action first to get its images
	const { data: action, error: fetchError } = await supabase
		.from('trainer_visit_actions')
		.select('id, images')
		.eq('id', actionId)
		.single();

	if (fetchError || !action) {
		console.error('[deleteVisitAction] Fetch error:', fetchError);
		return { success: false, message: 'Σφάλμα κατά την ανάκτηση ενέργειας' };
	}

	// Delete images from storage
	await deleteVisistImages(supabase, action.images || []);

	// Delete the action row
	const { error } = await supabase.from('trainer_visit_actions').delete().eq('id', actionId);

	if (error) {
		console.error('[deleteVisitAction] Error:', error);
		return { success: false, message: 'Σφάλμα κατά τη διαγραφή ενέργειας' };
	}

	return { success: true };
});

/**
 * Cancel a visit — deletes the visit and all its actions
 */
const cancelVisitSchema = z.object({
	visitId: z.number().int().positive()
});

/**
 * Cancel a visit — deletes images, actions, and the visit itself
 */
export const cancelVisit = command(cancelVisitSchema, async ({ visitId }) => {
	const supabase = createAdminClient(); // need admin for storage + cross-org
	const profile = await getUserProfileWithRoleCheck([1, 3]);

	// Fetch all actions to get their images
	const { data: actions } = await supabase
		.from('trainer_visit_actions')
		.select('id, images')
		.eq('visit_id', visitId);

	// Delete all images from storage
	const allImages = (actions || []).flatMap((a) => a.images || []);
	await deleteVisistImages(supabase, allImages);

	// Delete actions
	await supabase.from('trainer_visit_actions').delete().eq('visit_id', visitId);

	// Delete the visit
	const { error } = await supabase.from('trainer_service_visits').delete().eq('id', visitId);

	if (error) {
		console.error('[cancelVisit] Error:', error);
		return { success: false, message: 'Σφάλμα κατά την ακύρωση επίσκεψης' };
	}

	return { success: true };
});
/**
 * Get a single org with its equipment (for org detail page)
 */
const getOrgEquipmentSchema = z.object({
	orgId: z.number().int().positive()
});

/**
 * Resolve maintenance logs in bulk (trainer marks them as resolved when completing a visit)
 */
const resolveLogsSchema = z.object({
	logIds: z.array(z.number().int().positive()).min(1),
	orgId: z.number().int().positive()
});

export const resolveMaintenanceLogs = command(resolveLogsSchema, async ({ logIds, orgId }) => {
	const supabase = createAdminClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	const { error } = await supabase
		.from('maintenance_logs')
		.update({
			status: 'resolved',
			resolved_at: new Date().toISOString(),
			resolved_by: profile.id
		})
		.in('id', logIds)
		.in('status', ['open', 'in_progress']);

	if (error) {
		console.error('[resolveMaintenanceLogs] Error:', error);
		return { success: false, message: 'Σφάλμα κατά την επίλυση βλαβών' };
	}

	// Send email notification to org admins (fire-and-forget)
	sendIssueResolvedNotification(logIds, orgId, profile.id).catch((err) =>
		console.error('[resolveMaintenanceLogs] Email error:', err)
	);

	return { success: true };
});

export const getOrgEquipment = query(getOrgEquipmentSchema, async ({ orgId }) => {
	const supabase = createAdminClient();
	await getUserProfileWithRoleCheck([3]);

	// Org info
	const { data: org, error: orgError } = await supabase
		.from('core_organizations')
		.select('id, store_name, location, phone')
		.eq('id', orgId)
		.single();

	if (orgError || !org) {
		console.error('[getOrgEquipment] Org error:', orgError);
		return { success: false, org: null, equipments: [], issues: [] };
	}

	// Equipment with log counts
	const { data: equipments, error: eqError } = await supabase
		.from('equipment')
		.select('*, maintenance_logs(count)')
		.eq('org_id', orgId)
		.in('maintenance_logs.status', ['open', 'progress'])
		.order('id', { ascending: false })
		.overrideTypes<EquipmentWithLogCount[]>();
	if (eqError) {
		console.error('[getOrgEquipment] Equipment error:', eqError);
		return { success: false, org, equipments: [], issues: [] };
	}

	const optimizedEquipments = (equipments || []).map((e) => ({
		...e,
		image_url: optimizeImage(e.image_url, 400, 75)
	}));

	// Recent issues for this org
	const equipmentIds = (equipments || []).map((e) => e.id);
	let issues: any[] = [];
	if (equipmentIds.length > 0) {
		const { data: logs } = await supabase
			.from('maintenance_logs')
			.select(
				`*, profiles!maintenance_logs_user_id_fkey (username, role, image_url),
				equipment!maintenance_logs_equipment_id_fkey (name, model)`
			)
			.in('equipment_id', equipmentIds)
			.eq('is_emergency', false)
			.in('status', ['open', 'proggress'])
			.order('created_at', { ascending: false })
			.limit(20);
		issues = logs || [];
	}

	return { success: true, org, equipments: optimizedEquipments, issues };
});

/**
 * Get a visit with all its actions (for visit detail page)
 */
const getVisitSchema = z.object({
	visitId: z.number().int().positive()
});

export const getVisitWithActions = query(getVisitSchema, async ({ visitId }) => {
	const supabase = createAdminClient();
	const profile = await getUserProfileWithRoleCheck([3]);

	const { data: visit, error: visitError } = await supabase
		.from('trainer_service_visits')
		.select(
			`*,
			core_organizations (id, store_name, location),
			trainer_visit_actions (
				*,
				equipment (id, name, model, image_url, status)
			)`
		)
		.eq('id', visitId)
		.eq('trainer_id', profile.id)
		.single();

	if (visitError || !visit) {
		console.error('[getVisitWithActions] Error:', visitError);
		return { success: false, visit: null };
	}

	// Also get all equipment for this org (for action form equipment picker)
	const { data: allEquipments } = await supabase
		.from('equipment')
		.select('id, name, model, status, image_url')
		.eq('org_id', visit.org_id)
		.order('name', { ascending: true });

	// Get open maintenance logs for this org
	const equipmentIds = (allEquipments || []).map((e: any) => e.id);
	let openIssues: any[] = [];
	if (equipmentIds.length > 0) {
		const { data: logs } = await supabase
			.from('maintenance_logs')
			.select(
				`*,
				profiles!maintenance_logs_user_id_fkey (username, image_url),
				equipment!maintenance_logs_equipment_id_fkey (name, model)`
			)
			.in('equipment_id', equipmentIds)
			.in('status', ['open', 'in_progress'])
			.order('created_at', { ascending: false });
		openIssues = logs || [];
	}

	return {
		success: true,
		visit,
		allEquipments: (allEquipments || []).map((e: any) => ({
			...e,
			image_url: optimizeImage(e.image_url, 400, 75)
		})),
		openIssues
	};
});

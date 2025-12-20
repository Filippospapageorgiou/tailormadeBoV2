import { query, command, form, prerender } from '$app/server';
import { createServerClient, createAdminClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import {
	getAllProfilesSameOrg,
	getUserOrgId,
	getUserProfile,
	getUserProfileWithRoleCheck
} from '$lib/supabase/queries';
import type { TaskTemplate, TaskTemplateWithTasks } from '$lib/models/tasks.types';

// ======================== AUTH ACCESS CHECK ==============

export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([1, 2]);
	return {
		success: true,
		profile
	};
});

export const getAllUsers = query(async () => {
	try {
		const org_id = await getUserOrgId();
		const users = await getAllProfilesSameOrg(org_id);
		return {
			users: users ?? [],
			success: true,
			message: 'Επιτυχία'
		};
	} catch (err) {
		console.error('[getAllUsers] Error fecthing all users from same org: ', err);
		return {
			users: [],
			success: false,
			message: 'Σφάλμα κάτα την ανάκτηση δεδομένων'
		};
	}
});

export const getAllTemplatesTask = query(async () => {
	const supabase = createServerClient();
	const org_id = await getUserOrgId();
	try {
		const { data: taskTemplatesWithTasks, error: templateError } = await supabase
			.from('task_templates')
			.select(`*,task_items (*)`)
			.eq('org_id', org_id)
			.overrideTypes<TaskTemplateWithTasks[]>();

		if (templateError) {
			return {
				taskTemplatesWithTasks: [],
				success: false,
				message: 'Σφάλμα κάτα την ανάκτηση δεδομένων'
			};
		}
		return {
			taskTemplatesWithTasks,
			success: true,
			message: 'Επιτυχία στην ανακτήση δεδομένων'
		};
	} catch (err) {
		console.error('[getAllTemplatesTask] Error fetching template tasks: ', err);
		return {
			success: false,
			message: 'Σφάλμα κάτα την ανάκτηση δεδομένων'
		};
	}
});

const TaskTemplateSchema = z.object({
	id: z.uuid().optional(),
	name: z.string().trim().min(1, { message: 'Name is required' }),
	description: z.string().trim().min(1, { message: 'Description is required' }),
	is_active: z.string().refine((val) => {
		if (typeof val === 'string') {
			if (val.toLowerCase() === 'true' || val === 'on') return true;
			if (val.toLowerCase() === 'false') return false;
		}
		return Boolean(val);
	})
});

const DeleteSchema = z.object({
	id: z.string()
});

export const addTaskTemplate = form(TaskTemplateSchema, async (data) => {
	const supabase = createServerClient();
	try {
		const profile = await getUserProfile();
		// Fixed table name typo: task_templated -> task_templates
		const { error } = await supabase.from('task_templates').insert({
			org_id: profile.org_id,
			name: data.name,
			description: data.description,
			is_active: data.is_active,
			created_by: profile.id
		});

		if (error) throw error;

		return {
			success: true,
			message: 'Το πρότυπο δημιουργήθηκε με επιτυχία' // Fixed typo: προτωτύπο
		};
	} catch (err) {
		console.error('[addTaskTemplate] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την δημιουργία προτύπου'
		};
	}
});

export const updateTaskTemplate = form(TaskTemplateSchema, async (data) => {
	const supabase = createServerClient();
	if (!data.id) return { success: false, message: 'Missing Template ID' };
	const profile = await getUserProfile();
	try {
		const { error } = await supabase
			.from('task_templates')
			.update({
				name: data.name,
				description: data.description,
				is_active: data.is_active,
				created_by: profile.id
			})
			.eq('id', data.id);

		if (error) throw error;

		return {
			success: true,
			message: 'Το πρότυπο ενημερώθηκε με επιτυχία'
		};
	} catch (err) {
		console.error('[updateTaskTemplate] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ενημέρωση του προτύπου'
		};
	}
});

export const deleteTaskTemplate = command(DeleteSchema, async (data) => {
	const supabase = createServerClient();
	try {
		const { error } = await supabase.from('task_templates').delete().eq('id', data.id);

		if (error) throw error;

		return {
			success: true,
			message: 'Το πρότυπο διαγράφηκε με επιτυχία'
		};
	} catch (err) {
		console.error('[deleteTaskTemplate] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την διαγραφή του προτύπου'
		};
	}
});

const TaskItemSchema = z.object({
	id: z.uuid().optional(),
	template_id: z.uuid(),
	title: z.string().trim().min(1, { message: 'Title is required' }),
	description: z.string().trim().optional(),

	position: z
		.string()
		.default('0')
		.transform((val) => {
			const parsed = parseInt(val, 10);
			return isNaN(parsed) ? 0 : parsed;
		}),

	estimated_minutes: z
		.string()
		.optional()
		.transform((val) => {
			if (!val || val.trim() === '') return null;
			const parsed = parseInt(val, 10);
			return isNaN(parsed) ? null : parsed;
		}),

	requires_photo: z
		.string()
		.optional()
		.default('false')
		.transform((val) => {
			return val.toLowerCase() === 'true' || val === 'on';
		})
});
const DeleteItemSchema = z.object({
	id: z.string()
});

// ======================== TASK ITEM ACTIONS ========================

export const addTaskItem = form(TaskItemSchema, async (data) => {
	const supabase = createServerClient();
	try {
		const { error } = await supabase.from('task_items').insert({
			template_id: data.template_id,
			title: data.title,
			description: data.description,
			position: data.position,
			requires_photo: data.requires_photo,
			estimated_minutes: data.estimated_minutes
		});

		if (error) throw error;

		return {
			success: true,
			message: 'Το αντικείμενο προστέθηκε με επιτυχία'
		};
	} catch (err) {
		console.error('[addTaskItem] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την προσθήκη αντικειμένου'
		};
	}
});

export const updateTaskItem = form(TaskItemSchema, async (data) => {
	const supabase = createServerClient();
	if (!data.id) return { success: false, message: 'Missing Item ID' };

	try {
		const { error } = await supabase
			.from('task_items')
			.update({
				title: data.title,
				description: data.description,
				position: data.position,
				requires_photo: data.requires_photo,
				estimated_minutes: data.estimated_minutes
			})
			.eq('id', data.id);

		if (error) throw error;

		return {
			success: true,
			message: 'Το αντικείμενο ενημερώθηκε με επιτυχία'
		};
	} catch (err) {
		console.error('[updateTaskItem] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ενημέρωση του αντικειμένου'
		};
	}
});

export const deleteTaskItem = command(DeleteItemSchema, async (data) => {
	const supabase = createServerClient();
	try {
		const { error } = await supabase.from('task_items').delete().eq('id', data.id);

		if (error) throw error;

		return {
			success: true,
			message: 'Το αντικείμενο διαγράφηκε με επιτυχία'
		};
	} catch (err) {
		console.error('[deleteTaskItem] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την διαγραφή του αντικειμένου'
		};
	}
});

const TaskTemplateSchemaWithTasks = z.object({
	name: z.string().trim().min(1, 'Το όνομα είναι υποχρεωτικό'),
	description: z.string().trim().min(1, 'Η περιγραφή είναι υποχρεωτική'),
	is_active: z
		.string()
		.default('true')
		.transform((v) => v === 'true' || v === 'on'),
	task_items: z
		.record(z.string(), z.object({
			title: z.string().trim().min(1, 'Ο τίτλος είναι υποχρεωτικός'),
			estimated_minutes: z
				.string()
				.default('0')
				.transform((v) => parseInt(v) || 0),
			requires_photo: z
				.string()
				.optional()
				.default('false')
				.transform((v) => v === 'true' || v === 'on'),
			position: z
				.string()
				.default('0')
				.transform((v) => parseInt(v) || 0)
		}))
		.transform((obj) => Object.values(obj)) 
		.default([])
});

export const addTaskTemplateWithTasks = form(TaskTemplateSchemaWithTasks, async (data) => {
	const supabase = createServerClient();
	const profile = await getUserProfile();

	// 1. Insert the Template first
	const { data: template, error: tError } = await supabase
		.from('task_templates')
		.insert({
			name: data.name,
			description: data.description,
			is_active: data.is_active,
			org_id: profile.org_id,
			created_by: profile.id
		})
		.select()
		.single();

	if (tError) throw tError;

	// 2. Insert the Tasks with the new template_id
	if (data.task_items.length > 0) {
		const tasksToInsert = data.task_items.map((item) => ({
			...item,
			template_id: template.id
		}));

		const { error: iError } = await supabase.from('task_items').insert(tasksToInsert);
		if (iError) throw iError;
	}

	return { success: true };
});

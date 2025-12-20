export interface TaskTemplate {
	id: string; // uuid
	org_id: number; // bigint
	name: string | null;
	description: string | null;
	is_active: boolean;
	created_by: string; // uuid (profiles.id)
	created_at: string; // ISO timestamp
	updated_at: string; // ISO timestamp
}

export interface TaskItem {
	id: string; // uuid
	template_id: string; // uuid (task_templates.id)
	title: string;
	description: string | null;
	position: number;
	requires_photo: boolean;
	estimated_minutes: number | null;
	created_at: string; // ISO timestamp
	updated_at: string; // ISO timestamp
}

export interface UserDailyTask {
	id: string; // uuid
	user_id: string; // uuid (profiles.id)
	task_item_id: string; // uuid (task_items.id)
	task_date: string; // YYYY-MM-DD
	assigned_by: string | null; // uuid (profiles.id)
	completed: boolean;
	completed_at: string | null;
	notes: string | null;
	photo_url: string | null;
	created_at: string; // ISO timestamp
}

export interface TaskTemplateWithTasks extends TaskTemplate {
	task_items: TaskItem[];
}

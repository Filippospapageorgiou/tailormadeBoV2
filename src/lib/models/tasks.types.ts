export interface TaskTemplate {
	id: string;
	org_id: number;
	name: string | null;
	description: string | null;
	is_active: boolean;
	created_by: string;
	created_at: string;
	updated_at: string;
	frequency: 'daily' | 'weekly' | 'monthly'; // FIXED typo + typed
}

export interface TaskItem {
	id: string;
	template_id: string;
	title: string;
	description: string | null;
	position: number;
	requires_photo: boolean;
	estimated_minutes: number | null;
	created_at: string;
	updated_at: string;
	scheduled_time: string;
}

export interface UserDailyTask {
	id: string;
	user_id: string;
	task_item_id: string;
	task_date: string;
	assigned_by: string | null;
	completed: boolean;
	completed_at: string | null;
	notes: string | null;
	photo_url: string | null;
	created_at: string;
	task_items: TaskItem;
}

export interface UserWeeklyTask {
	id: string;
	user_id: string;
	task_item_id: string;
	week_start_date: string;
	assigned_by: string | null;
	completed: boolean;
	completed_at: string | null;
	notes: string | null;
	photo_url: string | null;
	created_at: string;
	task_items: TaskItem;
}

export interface UserMonthlyTask {
	id: string;
	user_id: string;
	task_item_id: string;
	month_date: string;
	assigned_by: string | null;
	completed: boolean;
	completed_at: string | null;
	notes: string | null;
	photo_url: string | null;
	created_at: string;
	task_items: TaskItem;
}


export interface TaskTemplateWithTasks extends TaskTemplate {
	task_items: TaskItem[];
}
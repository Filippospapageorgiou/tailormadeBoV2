// src/lib/models/notification.types.ts

export type NotificationType =
	| 'recipe_added'
	| 'blog_published'
	| 'schedule_published'
	| 'equipment_added'
	| 'daily_tasks'
	| 'shift_request_update';

export interface Notification {
	id: number;
	org_id: number | null;
	user_id: string;
	type: NotificationType;
	title: string;
	message: string;
	reference_id: string | null;
	reference_url: string | null;
	is_read: boolean;
	read_at: string | null;
	created_at: string;
}

export interface NotificationGroup {
	today: Notification[];
	yesterday: Notification[];
	older: Notification[];
}
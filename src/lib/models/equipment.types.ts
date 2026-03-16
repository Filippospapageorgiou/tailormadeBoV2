// src/lib/models/database.types.ts

export type EquipmentStatus = 'operational' | 'broken' | 'maintenance';

export interface Equipment {
	id: number;
	org_id: number;
	name: string;
	model: string | null;
	serial_number: string | null;
	image_url: string | null;
	manual_url: string | null;
	status: EquipmentStatus;

	// Date strings from Supabase (ISO format YYYY-MM-DD)
	purchase_date: string | null;
	last_service_date: string | null;
	next_service_date: string | null;

	created_at: string;
}

export interface MaintenanceLog {
	id: number;
	equipment_id: number | null; // null για emergency faults
	user_id: string;
	issue_description: string;
	action_taken: string | null;
	status_after: 'operational' | 'broken' | 'maintenance' | null;
	cost: number;
	created_at: string;
	images: string[] | null;
	// Emergency fault fields
	org_id: number | null;
	is_emergency: boolean;
	title: string | null;
	status: 'open' | 'in_progress' | 'resolved';
	resolved_at: string | null;
	resolved_by: string | null; // UUID
}

// --- Joined Types (For UI Display) ---

// When fetching logs, you usually want the User's name, not just their UUID
export interface MaintenanceLogWithUser extends MaintenanceLog {
	profiles: {
		username: string;
		role: string;
		image_url: string | null;
	} | null;
}

// When fetching Equipment, you might want the latest log attached
export interface EquipmentWithLogs extends Equipment {
	maintenance_logs: MaintenanceLogWithUser[];
}

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

// Lightweight shape for the equipment list — only the log count, not full logs
export interface EquipmentWithLogCount extends Equipment {
	maintenance_logs: [{ count: number }];
}

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

// --- Trainer Service Visits ---

export type VisitStatus = 'in_progress' | 'completed';

export type VisitActionType =
	| 'inspected'
	| 'cleaned_maintained'
	| 'repaired_on_site'
	| 'took_for_service'
	| 'returned_from_service'
	| 'replaced_part'
	| 'marked_as_broken';

export const VISIT_ACTION_LABELS: Record<VisitActionType, string> = {
	inspected: 'Επιθεώρηση',
	cleaned_maintained: 'Καθαρισμός / Συντήρηση',
	repaired_on_site: 'Επισκευή επί τόπου',
	took_for_service: 'Παραλαβή για service',
	returned_from_service: 'Επιστροφή από service',
	replaced_part: 'Αντικατάσταση εξαρτήματος',
	marked_as_broken: 'Σήμανση ως βλάβη'
};

export interface TrainerServiceVisit {
	id: number;
	trainer_id: string; // UUID
	org_id: number;
	visit_date: string; // YYYY-MM-DD
	status: VisitStatus;
	notes: string | null;
	created_at: string;
	completed_at: string | null;
}

export interface TrainerVisitAction {
	id: number;
	visit_id: number;
	equipment_id: number;
	action_type: VisitActionType;
	description: string;
	images: string[] | null;
	cost: number;
	status_change: EquipmentStatus | null;
	next_service_date: string | null;
	created_at: string;
}

// --- Joined Types for Trainer Views ---

export interface TrainerServiceVisitWithActions extends TrainerServiceVisit {
	trainer_visit_actions: TrainerVisitActionWithEquipment[];
}

export interface TrainerVisitActionWithEquipment extends TrainerVisitAction {
	equipment: Pick<Equipment, 'id' | 'name' | 'model' | 'image_url'>;
}

export interface TrainerServiceVisitWithOrg extends TrainerServiceVisit {
	core_organizations: {
		id: number;
		store_name: string;
		location: string | null;
	};
}

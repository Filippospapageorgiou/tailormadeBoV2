import type { Organization, Profile, RoleTypes } from '$lib/models/database.types';
import type { Equipment } from '$lib/models/equipment.types';

// Bonus-related types
export interface BonusPeriod {
	id: number;
	quarter: number;
	year: number;
	comparison_quarter: number;
	comparison_year: number;
	network_average_percentage: number | null;
	status: 'draft' | 'published';
	created_by: string;
	published_by: string | null;
	published_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface BonusOrganizationData {
	id: number;
	period_id: number;
	org_id: number;
	current_kilos: number;
	previous_kilos: number;
	kilo_difference: number;
	percentage_change: number;
	above_network_average: boolean;
	base_bonus: number;
	multiplier: number;
	final_bonus: number;
	total_bonus_pool: number;
	total_hours_worked: number;
	created_at: string;
	updated_at: string;
}

export interface BonusEmployeePayout {
	id: number;
	org_data_id: number;
	user_id: string;
	total_shifts_in_pool: number;
	bonus_amount: number;
	hours_worked: number | null;
	percentage_share: number | null;
	created_at: string;
	// Joined data
	employee?: {
		id: string;
		username: string;
		email: string;
		image_url: string | null;
	};
}

export interface BonusHistoryItem {
	period: BonusPeriod;
	orgData: BonusOrganizationData;
	payouts: BonusEmployeePayout[];
}

export interface TaskUserStat {
	userId: string;
	daily: { total: number; completed: number };
	weekly: { total: number; completed: number };
	monthly: { total: number; completed: number };
}

export interface PageData {
	organization: Organization;
	employees: Profile[];
	equipment: Equipment[];
	roleTypes: RoleTypes[];
	bonusHistory: BonusHistoryItem[];
	shiftCountByUser: Record<string, number>;
	taskStats: TaskUserStat[];
	stats: {
		employeeCount: number;
		equipmentCount: number;
		activeEquipment: number;
		maintenanceEquipment: number;
		totalShifts: number;
		schedulesCount: number;
	};
	profile: Profile;
}

export type PageProps = {
	data: PageData;
};
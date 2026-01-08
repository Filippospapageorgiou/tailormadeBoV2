import type { Organization, Profile, RoleTypes } from '$lib/models/database.types';
import type { Equipment } from '$lib/models/equipment.types';

export interface PageData {
	organization: Organization;
	employees: Profile[];
	equipment: Equipment[];
	roleTypes: RoleTypes[];
	stats: {
		employeeCount: number;
		equipmentCount: number;
		activeEquipment: number;
		maintenanceEquipment: number;
	};
	profile: Profile;
}

export type PageProps = {
	data: PageData;
};


import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import type { Organization, Profile } from '$lib/models/database.types';
import type { Equipment } from '$lib/models/equipment.types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	// Only super_admin (role_id: 1) can access this
	const profile = await getUserProfileWithRoleCheck([1]);

	const { id } = params;

	if (!id || isNaN(Number(id))) {
		throw error(400, 'Invalid organization ID');
	}

	const orgId = Number(id);

	try {
		// Fetch the organization
		const { data: organization, error: orgError } = await supabase
			.from('core_organizations')
			.select('*')
			.eq('id', orgId)
			.single();

		if (orgError || !organization) {
			console.error('[OrganizationDetail] Error fetching organization:', orgError);
			throw error(404, 'Organization not found');
		}

		// Fetch employees for this organization
		const { data: employees, error: employeesError } = await supabase
			.from('profiles')
			.select(`
				*,
				role_types!role_id(role_name)
			`)
			.eq('org_id', orgId)
			.order('created_at', { ascending: false });

		if (employeesError) {
			console.error('[OrganizationDetail] Error fetching employees:', employeesError);
		}

		// Flatten employees with role_name
		const flattenedEmployees: Profile[] =
			employees?.map((emp: any) => ({
				...emp,
				role_name: emp.role_types?.role_name || ''
			})) || [];

		// Fetch equipment for this organization
		const { data: equipment, error: equipmentError } = await supabase
			.from('equipment')
			.select('*')
			.eq('org_id', orgId);

		if (equipmentError) {
			console.error('[OrganizationDetail] Error fetching equipment:', equipmentError);
		}

		// Fetch role types for the invite modal
		const { data: roleTypes, error: roleTypesError } = await supabase
			.from('role_types')
			.select('*')
			.neq('id', 1); // Exclude super_admin from invite options

		if (roleTypesError) {
			console.error('[OrganizationDetail] Error fetching role types:', roleTypesError);
		}

		// Calculate stats
		const employeeCount = flattenedEmployees.length;
		const equipmentCount = equipment?.length || 0;
		const activeEquipment = equipment?.filter((e: Equipment) => e.status === 'operational').length || 0;
		const maintenanceEquipment = equipment?.filter((e: Equipment) => e.status === 'maintenance').length || 0;

		return {
			organization: organization as Organization,
			employees: flattenedEmployees,
			equipment: equipment || [],
			roleTypes: roleTypes || [],
			stats: {
				employeeCount,
				equipmentCount,
				activeEquipment,
				maintenanceEquipment
			},
			profile
		};
	} catch (err) {
		console.error('[OrganizationDetail] Error loading organization details:', err);
		throw error(500, 'Failed to load organization data');
	}
};
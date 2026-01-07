import { query, command, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import type { Organization } from '$lib/models/database.types';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { z } from 'zod/v4';

export interface OrganizationWithCounts extends Organization {
	employee_count: number;
	equipment_count: number;
}

export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([1]);
	return {
		profile,
		success: true
	};
});

// ======================== FORM SCHEMAS ==============

const createOrganizationSchema = z.object({
    id:z.string().optional(),
	store_name: z.string().min(1, 'Store name is required').max(100, 'Store name too long'),
	email: z.email('Invalid email address').optional().or(z.literal('')),
	phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
	country: z.string().max(50, 'Country name too long').optional().or(z.literal('')),
	location: z.string().max(200, 'Location too long').optional().or(z.literal('')),
	status: z.string().transform((val) => val === 'true')
});

export const createOrganization = form(createOrganizationSchema, async (data) => {
	const supabase = createServerClient();

	try {
		const { data: newOrg, error: insertError } = await supabase
			.from('core_organizations')
			.insert({
				store_name: data.store_name,
				email: data.email || null,
				phone: data.phone || null,
				country: data.country || null,
				location: data.location || null,
				status: data.status
			})
			.select()
			.single();

		if (insertError) {
			console.error('[createOrganization] Error creating organization:', insertError);
			return {
				success: false,
				message: 'Σφάλμα κατά τη δημιουργία οργανισμού'
			};
		}

		return {
			success: true,
			message: 'Ο οργανισμός δημιουργήθηκε επιτυχώς',
			organization: newOrg
		};
	} catch (err) {
		console.error('[createOrganization] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα κατά τη δημιουργία'
		};
	}
});

const updateOrganizationSchema = z.object({
	id: z.string().transform((val) => parseInt(val, 10)),
	store_name: z.string().min(1, 'Store name is required').max(100, 'Store name too long'),
	email: z.email('Invalid email address').optional().or(z.literal('')),
	phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
	country: z.string().max(50, 'Country name too long').optional().or(z.literal('')),
	location: z.string().max(200, 'Location too long').optional().or(z.literal('')),
	status: z.string().transform((val) => val === 'true')
});

export const updateOrganization = form(updateOrganizationSchema, async (data) => {
	const supabase = createServerClient();
	try {
		const { data: updatedOrg, error: updateError } = await supabase
			.from('core_organizations')
			.update({
				store_name: data.store_name,
				email: data.email || null,
				phone: data.phone || null,
				country: data.country || null,
				location: data.location || null,
				status: data.status
			})
			.eq('id', data.id)
			.select()
			.single();

		if (updateError) {
			console.error('[updateOrganization] Error updating organization:', updateError);
			return {
				success: false,
				message: 'Σφάλμα κατά την ενημέρωση οργανισμού'
			};
		}

		return {
			success: true,
			message: 'Ο οργανισμός ενημερώθηκε επιτυχώς',
			organization: updatedOrg
		};
	} catch (err) {
		console.error('[updateOrganization] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα κατά την ενημέρωση'
		};
	}
});

// ======================== COMMANDS ==============

const deleteOrganizationSchema = z.object({
	organizationId: z.number().int().positive({ error: 'Organization ID must be a positive integer' })
});

export const deleteOrganization = command(deleteOrganizationSchema, async ({ organizationId }) => {
	const supabase = createServerClient();

	try {
		const { error } = await supabase
			.from('core_organizations')
			.delete()
			.eq('id', organizationId);

		if (error) {
			console.error('[deleteOrganization] Error deleting organization:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά τη διαγραφή οργανισμού'
			};
		}

		return {
			success: true,
			message: 'Ο οργανισμός διαγράφηκε επιτυχώς'
		};
	} catch (err) {
		console.error('[deleteOrganization] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα κατά τη διαγραφή'
		};
	}
});

// ======================== QUERIES ==============

export const getAllOrganizations = query(async () => {
	const supabase = createServerClient();

	try {
		// Fetch all organizations
		const { data: organizations, error: organizationError } = await supabase
			.from('core_organizations')
			.select('*')
			.overrideTypes<Organization[]>();

		if (organizationError) {
			console.error('[getAllOrganizations] Error fetching all organizations: ', organizationError);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση οργανισμών',
				organizations: []
			};
		}

		if (!organizations || organizations.length === 0) {
			return {
				success: true,
				message: 'Δεν βρέθηκαν οργανισμοί',
				organizations: []
			};
		}

		// Fetch employee counts per organization
		const { data: employeeCounts, error: employeeError } = await supabase
			.from('profiles')
			.select('org_id');

		if (employeeError) {
			console.error('[getAllOrganizations] Error fetching employee counts: ', employeeError);
		}

		// Fetch equipment counts per organization
		const { data: equipmentCounts, error: equipmentError } = await supabase
			.from('equipment')
			.select('org_id');

		if (equipmentError) {
			console.error('[getAllOrganizations] Error fetching equipment counts: ', equipmentError);
		}

		// Create count maps
		const employeeCountMap = new Map<number, number>();
		const equipmentCountMap = new Map<number, number>();

		// Count employees per org
		if (employeeCounts) {
			employeeCounts.forEach((profile) => {
				if (profile.org_id) {
					const currentCount = employeeCountMap.get(profile.org_id) || 0;
					employeeCountMap.set(profile.org_id, currentCount + 1);
				}
			});
		}

		// Count equipment per org
		if (equipmentCounts) {
			equipmentCounts.forEach((equipment) => {
				if (equipment.org_id) {
					const currentCount = equipmentCountMap.get(equipment.org_id) || 0;
					equipmentCountMap.set(equipment.org_id, currentCount + 1);
				}
			});
		}

		// Merge counts with organizations
		const organizationsWithCounts: OrganizationWithCounts[] = organizations.map((org) => ({
			...org,
			employee_count: employeeCountMap.get(org.id) || 0,
			equipment_count: equipmentCountMap.get(org.id) || 0
		}));

		return {
			success: true,
			message: 'Επιτυχής ανάκτηση οργανισμών',
			organizations: organizationsWithCounts
		};
	} catch (err) {
		console.error('[getAllOrganizations] Error fetching all organizations: ', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ανάκτηση οργανισμών',
			organizations: []
		};
	}
});
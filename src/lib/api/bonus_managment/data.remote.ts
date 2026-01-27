import { query, command } from '$app/server';
import type {
	BonusOrganizationData,
	BonusPeriod,
	BonusEmployeePayout
} from '$lib/models/bonus_organization.types';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { createServerClient } from '$lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod/v4';
import { BONUS_CONSTANTS } from '$lib/models/bonus_organization.types';

// Auth check - only super_admin can access
export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([1]);
	return {
		profile,
		success: true
	};
});

async function updateLeaderboardCache(
	supabase: SupabaseClient,
	periodId: number
): Promise<{ success: boolean; error?: string }> {
	try {
		// 1. Φέρε όλα τα organization data για αυτό το period, ταξινομημένα
		const { data: orgData, error: fetchError } = await supabase
			.from('bonus_organization_data')
			.select('org_id, percentage_change')
			.eq('period_id', periodId)
			.order('percentage_change', { ascending: false });

		if (fetchError) {
			console.error('[updateLeaderboardCache] Error fetching org data:', fetchError);
			return { success: false, error: 'Failed to fetch organization data' };
		}

		if (!orgData || orgData.length === 0) {
			return { success: true }; // Δεν υπάρχουν δεδομένα
		}

		// 2. Δημιούργησε τα leaderboard entries με rank
		const leaderboardEntries = orgData.map((org, index) => ({
			period_id: periodId,
			org_id: org.org_id,
			rank: index + 1,
			percentage_change: org.percentage_change
		}));

		// 3. Upsert στο cache (αν υπάρχει ήδη, update)
		const { error: upsertError } = await supabase
			.from('bonus_leaderboard_cache')
			.upsert(leaderboardEntries, {
				onConflict: 'period_id,org_id'
			});

		if (upsertError) {
			console.error('[updateLeaderboardCache] Error upserting leaderboard:', upsertError);
			return { success: false, error: 'Failed to update leaderboard cache' };
		}

		return { success: true };
	} catch (err) {
		console.error('[updateLeaderboardCache] Unexpected error:', err);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

interface parsedData {
	org_id: number;
	store_name: string;
	current_kilos: number;
	previous_kilos: number;
	kilo_difference: number;
	percentage_change: number;
}

interface EmployeeHours {
	user_id: string;
	total_minutes: number;
}

function getQuarterDateRange(quarter: number, year: number): { start: string; end: string } {
	const quarterStartMonth = (quarter - 1) * 3;
	
	// Δημιούργησε τις ημερομηνίες ως strings απευθείας (χωρίς timezone conversion)
	const startMonth = String(quarterStartMonth + 1).padStart(2, '0');
	const endMonth = String(quarterStartMonth + 3).padStart(2, '0');
	
	// Βρες την τελευταία μέρα του τελευταίου μήνα
	const lastDay = new Date(year, quarterStartMonth + 3, 0).getDate();
	return {
		start: `${year}-${startMonth}-01`,
		end: `${year}-${endMonth}-${lastDay}`
	};
}


async function calculateEmployeeBonuses(
	supabase: SupabaseClient,
	orgBonusData: BonusOrganizationData,
	quarter: number,
	year: number
): Promise<{ success: boolean; error?: string }> {
	try {
		const { start, end } = getQuarterDateRange(quarter, year);
		
		// 1. Fetch all work shifts for baristas only (role_id 4 or 5)
		// Using !shifts_user_id_fkey to specify the correct relationship
		const { data: shifts, error: shiftsError } = await supabase
			.from('shifts')
			.select(`
				user_id, 
				start_time, 
				end_time, 
				break_duration_minutes,
				profiles!shifts_user_id_fkey!inner(role_id)
			`)
			.eq('org_id', orgBonusData.org_id)
			.eq('shift_type', 'work')
			.gte('shift_date', start)
			.lte('shift_date', end)
			.in('profiles.role_id', [4, 5]);

		if (shiftsError) {
			console.error('[calculateEmployeeBonuses] Error fetching shifts:', shiftsError);
			return { success: false, error: 'Failed to fetch shifts' };
		}

		if (!shifts || shifts.length === 0) {
			// No shifts found, update total_hours_worked = 0
			await supabase
				.from('bonus_organization_data')
				.update({ total_hours_worked: 0 })
				.eq('id', orgBonusData.id);

			return { success: true };
		}

		// 2. Calculate minutes per employee
		const employeeHoursMap = new Map<string, number>();

		for (const shift of shifts) {
			if (!shift.start_time || !shift.end_time) continue;

			const [startHour, startMin] = shift.start_time.split(':').map(Number);
			const [endHour, endMin] = shift.end_time.split(':').map(Number);

			const startMinutes = startHour * 60 + startMin;
			const endMinutes = endHour * 60 + endMin;

			// Handle overnight shifts (e.g., 22:00 to 06:00)
			let netMinutes = endMinutes - startMinutes;
			if (netMinutes < 0) {
				netMinutes += 24 * 60; // Add 24 hours worth of minutes
			}

			if (netMinutes > 0) {
				const current = employeeHoursMap.get(shift.user_id) || 0;
				employeeHoursMap.set(shift.user_id, current + netMinutes);
			}
		}

		// 3. Filter employees with zero hours
		const employeesWithHours: EmployeeHours[] = Array.from(employeeHoursMap.entries())
			.filter(([_, minutes]) => minutes > 0)
			.map(([user_id, total_minutes]) => ({ user_id, total_minutes }));

		if (employeesWithHours.length === 0) {
			await supabase
				.from('bonus_organization_data')
				.update({ total_hours_worked: 0 })
				.eq('id', orgBonusData.id);

			return { success: true };
		}

		// 4. Calculate total hours
		const totalMinutes = employeesWithHours.reduce((sum, emp) => sum + emp.total_minutes, 0);
		const totalHoursWorked = Math.round((totalMinutes / 60) * 100) / 100;

		// 5. Calculate bonus for each employee
		const payouts: Omit<BonusEmployeePayout, 'id' | 'created_at'>[] = employeesWithHours.map(
			(emp) => {
				const hoursWorked = Math.round((emp.total_minutes / 60) * 100) / 100;
				const percentageShare = Math.round((emp.total_minutes / totalMinutes) * 100 * 100) / 100;
				const bonusAmount =
					Math.round((percentageShare / 100) * orgBonusData.total_bonus_pool * 100) / 100;

				return {
					org_data_id: orgBonusData.id,
					user_id: emp.user_id,
					hours_worked: hoursWorked,
					percentage_share: percentageShare,
					bonus_amount: bonusAmount,
					total_shifts_in_pool: shifts.filter((s) => s.user_id === emp.user_id).length
				};
			}
		);

		// 6. Insert payouts
		const { error: payoutsError } = await supabase.from('bonus_employee_payouts').insert(payouts);

		if (payoutsError) {
			console.error('[calculateEmployeeBonuses] Error inserting payouts:', payoutsError);
			return { success: false, error: 'Failed to insert employee payouts' };
		}

		// 7. Update total_hours_worked in organization data
		const { error: updateError } = await supabase
			.from('bonus_organization_data')
			.update({ total_hours_worked: totalHoursWorked })
			.eq('id', orgBonusData.id);

		if (updateError) {
			console.error('[calculateEmployeeBonuses] Error updating total_hours_worked:', updateError);
			return { success: false, error: 'Failed to update organization data' };
		}

		return { success: true };
	} catch (err) {
		console.error('[calculateEmployeeBonuses] Unexpected error:', err);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

// Schema for parsed Excel row
const parsedExcelRowSchema = z.object({
	org_id: z.number().int().positive(),
	store_name: z.string(),
	current_kilos: z.number(),
	previous_kilos: z.number(),
	kilo_difference: z.number(),
	percentage_change: z.number()
});

// Schema for bonus import
const bonusImportSchema = z.object({
	quarter: z.number().int().min(1).max(4),
	year: z.number().int().min(2020).max(2100),
	previousYear: z.number().int().min(2020).max(2100),
	data: z.array(parsedExcelRowSchema).min(1, 'At least one row is required')
});

async function setOrganizationBonusData(
	supabase: SupabaseClient,
	bonusPeriod: BonusPeriod,
	data: parsedData
): Promise<{ success: boolean; orgBonusData?: BonusOrganizationData; error?: string }> {
	try {
		const aboveNet = data.percentage_change > bonusPeriod.network_average_percentage ? true : false;

		let base_bonus = 0;
		let mult = aboveNet ? 1.25 : 1;
		let final_bonus = 0;
		let total_bonus_pool = 0;

		if (data.percentage_change > 0) {
			base_bonus = data.kilo_difference * BONUS_CONSTANTS.BONUS_PER_KILO;
			final_bonus = aboveNet ? base_bonus * BONUS_CONSTANTS.MULTIPLIER_ABOVE_AVERAGE : base_bonus;
			total_bonus_pool = final_bonus;
		}

		const { data: OrganizationBonusData, error } = await supabase
			.from('bonus_organization_data')
			.insert({
				period_id: bonusPeriod.id,
				org_id: data.org_id,
				current_kilos: data.current_kilos,
				previous_kilos: data.previous_kilos,
				above_network_average: aboveNet,
				base_bonus,
				multiplier: mult,
				final_bonus,
				total_bonus_pool,
				total_hours_worked: 0
			})
			.select()
			.single<BonusOrganizationData>();

		if (error) {
			console.error('[setOrganizationBonusData] Error:', error);
			return { success: false, error: 'unexpected error occurred' };
		}

		// Υπολόγισε τα employee bonuses
		if (total_bonus_pool > 0) {
			const bonusResult = await calculateEmployeeBonuses(
				supabase,
				OrganizationBonusData,
				bonusPeriod.quarter,
				bonusPeriod.year
			);

			if (!bonusResult.success) {
				console.error('[setOrganizationBonusData] Failed to calculate employee bonuses:', bonusResult.error);
			}
		}

		return { success: true, orgBonusData: OrganizationBonusData };
	} catch (err) {
		console.error('[setOrganizationBonusData] Error:', err);
		return { success: false, error: 'unexpected error occurred' };
	}
}

export const importBonusData = command(bonusImportSchema, async (payload) => {
	const supabase = createServerClient();
	try {
		const profile = await getUserProfileWithRoleCheck([1]);

		const positiveChange = payload.data
			.map((row) => row.percentage_change)
			.filter((pct) => pct > 0);

		const avgPctChange =
			positiveChange.length > 0
				? (positiveChange.reduce((sum, ptc) => sum + ptc, 0) / positiveChange.length).toFixed(2)
				: 0;

		const { data: bonusPeriods, error: InsertBonusPeriodError } = await supabase
			.from('bonus_periods')
			.insert({
				quarter: payload.quarter,
				year: payload.year,
				comparison_quarter: payload.quarter,
				comparison_year: payload.previousYear,
				network_average_percentage: avgPctChange,
				status: 'draft',
				created_by: profile.id
			})
			.select()
			.single<BonusPeriod>();

		if (InsertBonusPeriodError) {
			console.error('[importBonusData] Error:', InsertBonusPeriodError);
			return {
				success: false,
				message: `Σφάλμα κατα τον υπολογισμό για σειρές για το Q${payload.quarter} ${payload.year}`
			};
		}

		// Process organization data
		const results = await Promise.all(
			payload.data.map((row) => setOrganizationBonusData(supabase, bonusPeriods, row))
		);

		// Update leaderboard cache μετά από όλα τα inserts
		const leaderboardResult = await updateLeaderboardCache(supabase, bonusPeriods.id);
		
		if (!leaderboardResult.success) {
			console.error('[importBonusData] Failed to update leaderboard cache:', leaderboardResult.error);
		}

		

		return {
			success: true,
			message: `Λάβαμε με επιτυχία ${payload.data.length} σειρές για το Q${payload.quarter} ${payload.year}`,
			summary: {
				totalRows: payload.data.length
			}
		};
	} catch (err) {
		console.error('[importBonusData] Error:', err);
		return {
			success: false,
			message: 'Failed to process bonus data'
		};
	}
});


// ======================== QUERIES ==============

// Get all bonus periods for the table
export const getAllBonusPeriods = query(async () => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]);

		const { data: periods, error } = await supabase
			.from('bonus_periods')
			.select(`
				*,
				bonus_organization_data(count)
			`)
			.order('year', { ascending: false })
			.order('quarter', { ascending: false });

		if (error) {
			console.error('[getAllBonusPeriods] Error:', error);
			return {
				success: false,
				periods: [],
				message: 'Σφάλμα κατά την ανάκτηση περιόδων'
			};
		}

		// Flatten the count
		const periodsWithCount = periods?.map((period) => ({
			...period,
			org_count: period.bonus_organization_data?.[0]?.count || 0
		})) || [];

		return {
			success: true,
			periods: periodsWithCount,
			message: 'Επιτυχής ανάκτηση περιόδων'
		};
	} catch (err) {
		console.error('[getAllBonusPeriods] Error:', err);
		return {
			success: false,
			periods: [],
			message: 'Σφάλμα κατά την ανάκτηση περιόδων'
		};
	}
});

const bonusPeriodDetailsSchema = z.object({
	periodId: z.number().int().positive()
});

export const getBonusPeriodDetails = query(bonusPeriodDetailsSchema, async ({ periodId }) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]);

		// Get period info
		const { data: period, error: periodError } = await supabase
			.from('bonus_periods')
			.select('*')
			.eq('id', periodId)
			.single<BonusPeriod>();

		if (periodError || !period) {
			console.error('[getBonusPeriodDetails] Period error:', periodError);
			return {
				success: false,
				message: 'Δεν βρέθηκε η περίοδος'
			};
		}

		// Get organization data with org names (without leaderboard - fetch separately)
		const { data: orgData, error: orgError } = await supabase
			.from('bonus_organization_data')
			.select(`
				*,
				core_organizations(store_name)
			`)
			.eq('period_id', periodId)
			.order('percentage_change', { ascending: false });

		if (orgError) {
			console.error('[getBonusPeriodDetails] Org data error:', orgError);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση δεδομένων οργανισμών'
			};
		}

		// Get leaderboard cache separately
		const { data: leaderboardData, error: leaderboardError } = await supabase
			.from('bonus_leaderboard_cache')
			.select('org_id, rank')
			.eq('period_id', periodId);

		if (leaderboardError) {
			console.error('[getBonusPeriodDetails] Leaderboard error:', leaderboardError);
			// Don't fail - just continue without ranks
		}

		// Create a map of org_id -> rank
		const rankMap = new Map<number, number>();
		leaderboardData?.forEach((item) => {
			rankMap.set(item.org_id, item.rank);
		});

		// Flatten the data and add ranks
		const orgDataFlattened = orgData?.map((org) => ({
			...org,
			org_name: org.core_organizations?.store_name || `Org #${org.org_id}`,
			rank: rankMap.get(org.org_id) || null
		})) || [];

		// Calculate totals
		const totals = {
			total_bonus_pool: orgDataFlattened.reduce((sum, org) => sum + (org.total_bonus_pool || 0), 0),
			total_hours_worked: orgDataFlattened.reduce((sum, org) => sum + (org.total_hours_worked || 0), 0),
			total_orgs: orgDataFlattened.length,
			orgs_with_bonus: orgDataFlattened.filter((org) => org.total_bonus_pool > 0).length
		};

		return {
			success: true,
			period,
			organizations: orgDataFlattened,
			totals,
			message: 'Επιτυχής ανάκτηση λεπτομερειών'
		};
	} catch (err) {
		console.error('[getBonusPeriodDetails] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ανάκτηση λεπτομερειών'
		};
	}
});

// Get employee payouts for a specific organization
const orgPayoutsSchema = z.object({
	orgDataId: z.number().int().positive()
});

export const getOrgEmployeePayouts = query(orgPayoutsSchema, async ({ orgDataId }) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]);

		const { data: payouts, error } = await supabase
			.from('bonus_employee_payouts')
			.select(`
				*,
				profiles(username, email, image_url, badge_color)
			`)
			.eq('org_data_id', orgDataId)
			.order('percentage_share', { ascending: false });

		if (error) {
			console.error('[getOrgEmployeePayouts] Error:', error);
			return {
				success: false,
				payouts: [],
				message: 'Σφάλμα κατά την ανάκτηση payouts'
			};
		}

		// Flatten employee data
		const payoutsFlattened = payouts?.map((payout) => ({
			...payout,
			username: payout.profiles?.username || 'Unknown',
			email: payout.profiles?.email || '',
			image_url: payout.profiles?.image_url || '',
			badge_color: payout.profiles?.badge_color || '#3b82f6'
		})) || [];

		return {
			success: true,
			payouts: payoutsFlattened,
			message: 'Επιτυχής ανάκτηση payouts'
		};
	} catch (err) {
		console.error('[getOrgEmployeePayouts] Error:', err);
		return {
			success: false,
			payouts: [],
			message: 'Σφάλμα κατά την ανάκτηση payouts'
		};
	}
});

// ======================== COMMANDS ==============

// Delete bonus period (cascades to org data and payouts)
const deleteBonusPeriodSchema = z.object({
	periodId: z.number().int().positive()
});

export const deleteBonusPeriod = command(deleteBonusPeriodSchema, async ({ periodId }) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]);

		// Check if period exists
		const { data: period, error: checkError } = await supabase
			.from('bonus_periods')
			.select('id, status')
			.eq('id', periodId)
			.single();

		if (checkError || !period) {
			return {
				success: false,
				message: 'Δεν βρέθηκε η περίοδος'
			};
		}

		// Optional: Prevent deletion of published periods
		// if (period.status === 'published') {
		// 	return {
		// 		success: false,
		// 		message: 'Δεν μπορείτε να διαγράψετε δημοσιευμένη περίοδο'
		// 	};
		// }

		// Delete period (CASCADE will handle org_data, payouts, leaderboard)
		const { error: deleteError } = await supabase
			.from('bonus_periods')
			.delete()
			.eq('id', periodId);

		if (deleteError) {
			console.error('[deleteBonusPeriod] Error:', deleteError);
			return {
				success: false,
				message: 'Σφάλμα κατά τη διαγραφή της περιόδου'
			};
		}

		return {
			success: true,
			message: 'Η περίοδος διαγράφηκε επιτυχώς'
		};
	} catch (err) {
		console.error('[deleteBonusPeriod] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά τη διαγραφή της περιόδου'
		};
	}
});

// Recalculate bonuses (already created, adding here for completeness)
const recalculateBonusSchema = z.object({
	periodId: z.number().int().positive()
});

export const recalculateBonuses = command(recalculateBonusSchema, async ({ periodId }) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]);

		// 1. Get bonus period
		const { data: bonusPeriod, error: periodError } = await supabase
			.from('bonus_periods')
			.select('*')
			.eq('id', periodId)
			.single<BonusPeriod>();

		if (periodError || !bonusPeriod) {
			console.error('[recalculateBonuses] Period not found:', periodError);
			return {
				success: false,
				message: 'Δεν βρέθηκε η περίοδος bonus'
			};
		}

		// 2. Get all organization data for this period
		const { data: orgDataList, error: orgDataError } = await supabase
			.from('bonus_organization_data')
			.select('*')
			.eq('period_id', periodId);

		if (orgDataError) {
			console.error('[recalculateBonuses] Error fetching org data:', orgDataError);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση δεδομένων οργανισμών'
			};
		}

		if (!orgDataList || orgDataList.length === 0) {
			return {
				success: false,
				message: 'Δεν βρέθηκαν δεδομένα οργανισμών για αυτή την περίοδο'
			};
		}

		// 3. Delete old employee payouts
		const orgDataIds = orgDataList.map((org) => org.id);

		const { error: deleteError } = await supabase
			.from('bonus_employee_payouts')
			.delete()
			.in('org_data_id', orgDataIds);

		if (deleteError) {
			console.error('[recalculateBonuses] Error deleting old payouts:', deleteError);
			return {
				success: false,
				message: 'Σφάλμα κατά τη διαγραφή παλιών payouts'
			};
		}

		// 4. Recalculate for each organization
		const results = await Promise.all(
			orgDataList.map((orgData) =>
				calculateEmployeeBonuses(
					supabase,
					orgData as BonusOrganizationData,
					bonusPeriod.quarter,
					bonusPeriod.year
				)
			)
		);

		const failedOrgs = results.filter((r) => !r.success);

		if (failedOrgs.length > 0) {
			console.error('[recalculateBonuses] Some orgs failed:', failedOrgs);
		}

		// 5. Update leaderboard cache
		const leaderboardResult = await updateLeaderboardCache(supabase, periodId);

		if (!leaderboardResult.success) {
			console.error('[recalculateBonuses] Failed to update leaderboard:', leaderboardResult.error);
		}

		return {
			success: true,
			message: `Επανυπολογίστηκαν τα bonuses για ${orgDataList.length} οργανισμούς`,
			summary: {
				totalOrgs: orgDataList.length,
				successfulOrgs: orgDataList.length - failedOrgs.length,
				failedOrgs: failedOrgs.length
			}
		};
	} catch (err) {
		console.error('[recalculateBonuses] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα κατά τον επανυπολογισμό'
		};
	}
});

// Publish bonus period
const publishBonusPeriodSchema = z.object({
	periodId: z.number().int().positive()
});

export const publishBonusPeriod = command(publishBonusPeriodSchema, async ({ periodId }) => {
	const supabase = createServerClient();

	try {
		const profile = await getUserProfileWithRoleCheck([1]);

		const { error } = await supabase
			.from('bonus_periods')
			.update({
				status: 'published',
				published_by: profile.id,
				published_at: new Date().toISOString()
			})
			.eq('id', periodId);

		if (error) {
			console.error('[publishBonusPeriod] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά τη δημοσίευση'
			};
		}

		return {
			success: true,
			message: 'Η περίοδος δημοσιεύτηκε επιτυχώς'
		};
	} catch (err) {
		console.error('[publishBonusPeriod] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά τη δημοσίευση'
		};
	}
});

// Unpublish bonus period (revert to draft)
const unpublishBonusPeriodSchema = z.object({
	periodId: z.number().int().positive()
});

export const unpublishBonusPeriod = command(unpublishBonusPeriodSchema, async ({ periodId }) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]);

		const { error } = await supabase
			.from('bonus_periods')
			.update({
				status: 'draft',
				published_by: null,
				published_at: null
			})
			.eq('id', periodId);

		if (error) {
			console.error('[unpublishBonusPeriod] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά την απόσυρση'
			};
		}

		return {
			success: true,
			message: 'Η περίοδος αποσύρθηκε επιτυχώς'
		};
	} catch (err) {
		console.error('[unpublishBonusPeriod] Error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την απόσυρση'
		};
	}
});
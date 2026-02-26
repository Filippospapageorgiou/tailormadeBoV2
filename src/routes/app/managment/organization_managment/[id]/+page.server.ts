import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import type { Organization, Profile } from '$lib/models/database.types';
import type { Equipment } from '$lib/models/equipment.types';
import type { BonusHistoryItem, BonusEmployeePayout, TaskUserStat } from './types';

function groupTasksByUser(tasks: Array<{ user_id: string; completed: boolean }>) {
	const result: Record<string, { total: number; completed: number }> = {};
	for (const t of tasks) {
		if (!result[t.user_id]) result[t.user_id] = { total: 0, completed: 0 };
		result[t.user_id].total++;
		if (t.completed) result[t.user_id].completed++;
	}
	return result;
}

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
			.eq('org_id', orgId)
			.order('name', { ascending: true });

		if (equipmentError) {
			console.error('[OrganizationDetail] Error fetching equipment:', equipmentError);
		}

		// Fetch role types for the invite modal
		const { data: roleTypes, error: roleTypesError } = await supabase
			.from('role_types')
			.select('*')

		if (roleTypesError) {
			console.error('[OrganizationDetail] Error fetching role types:', roleTypesError);
		}

		// Fetch bonus history for this organization
		const bonusHistory = await fetchBonusHistory(supabase, orgId);

		// Prepare for task + shift queries
		const today = new Date().toISOString().split('T')[0];
		const monthDate = today.slice(0, 7) + '-01';
		const todayObj = new Date();
		const dayOfWeek = todayObj.getDay();
		const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		const weekStartDate = new Date(todayObj);
		weekStartDate.setDate(todayObj.getDate() + daysToMonday);
		const weekStartStr = weekStartDate.toISOString().split('T')[0];
		const empIds = flattenedEmployees.map((e) => e.id);

		// Parallel fetch: shifts + schedules + tasks
		const [shiftsRes, schedulesRes, dailyRes, weeklyRes, monthlyRes] = await Promise.all([
			supabase.from('shifts').select('user_id').eq('org_id', orgId),
			supabase.from('weekly_schedules').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
			empIds.length > 0
				? supabase.from('user_daily_tasks').select('user_id, completed').eq('task_date', today).in('user_id', empIds)
				: Promise.resolve({ data: [] as any[], error: null }),
			empIds.length > 0
				? supabase.from('user_weekly_tasks').select('user_id, completed').gte('week_start_date', weekStartStr).lte('week_start_date', today).in('user_id', empIds)
				: Promise.resolve({ data: [] as any[], error: null }),
			empIds.length > 0
				? supabase.from('user_monthly_tasks').select('user_id, completed').eq('month_date', monthDate).in('user_id', empIds)
				: Promise.resolve({ data: [] as any[], error: null }),
		]);

		// Process shifts
		const shiftCountByUser: Record<string, number> = {};
		let totalShifts = 0;
		for (const s of (shiftsRes.data ?? [])) {
			shiftCountByUser[s.user_id] = (shiftCountByUser[s.user_id] ?? 0) + 1;
			totalShifts++;
		}

		// Process tasks
		const dailyByUser = groupTasksByUser(dailyRes.data ?? []);
		const weeklyByUser = groupTasksByUser(weeklyRes.data ?? []);
		const monthlyByUser = groupTasksByUser(monthlyRes.data ?? []);
		const taskStats: TaskUserStat[] = flattenedEmployees.map((emp) => ({
			userId: emp.id,
			daily: dailyByUser[emp.id] ?? { total: 0, completed: 0 },
			weekly: weeklyByUser[emp.id] ?? { total: 0, completed: 0 },
			monthly: monthlyByUser[emp.id] ?? { total: 0, completed: 0 },
		}));

		// Calculate stats
		const employeeCount = flattenedEmployees.length;
		const equipmentCount = equipment?.length || 0;
		const activeEquipment = equipment?.filter((e: Equipment) => e.status === 'operational').length || 0;
		const maintenanceEquipment = equipment?.filter((e: Equipment) => e.status === 'maintenance').length || 0;

		return {
			organization: organization as Organization,
			employees: flattenedEmployees,
			equipment: (equipment || []) as Equipment[],
			roleTypes: roleTypes || [],
			bonusHistory,
			shiftCountByUser,
			taskStats,
			stats: {
				employeeCount,
				equipmentCount,
				activeEquipment,
				maintenanceEquipment,
				totalShifts,
				schedulesCount: schedulesRes.count ?? 0,
			},
			profile
		};
	} catch (err) {
		console.error('[OrganizationDetail] Error loading organization details:', err);
		throw error(500, 'Failed to load organization data');
	}
};

/**
 * Fetch bonus history with periods, org data, and employee payouts
 */
async function fetchBonusHistory(supabase: any, orgId: number): Promise<BonusHistoryItem[]> {
	try {
		// Fetch bonus organization data for this org with period info
		const { data: bonusOrgData, error: bonusError } = await supabase
			.from('bonus_organization_data')
			.select(`
				*,
				bonus_periods (*)
			`)
			.eq('org_id', orgId)
			.order('created_at', { ascending: false });

		if (bonusError) {
			console.error('[OrganizationDetail] Error fetching bonus data:', bonusError);
			return [];
		}

		if (!bonusOrgData || bonusOrgData.length === 0) {
			return [];
		}

		// Get all org_data_ids to fetch payouts
		const orgDataIds = bonusOrgData.map((item: any) => item.id);

		// Fetch all employee payouts for these org_data records
		const { data: payouts, error: payoutsError } = await supabase
			.from('bonus_employee_payouts')
			.select(`
				*,
				profiles!user_id (
					id,
					username,
					email,
					image_url
				)
			`)
			.in('org_data_id', orgDataIds)
			.order('bonus_amount', { ascending: false });

		if (payoutsError) {
			console.error('[OrganizationDetail] Error fetching payouts:', payoutsError);
		}

		// Group payouts by org_data_id
		const payoutsByOrgData = new Map<number, BonusEmployeePayout[]>();
		if (payouts) {
			for (const payout of payouts) {
				const orgDataId = payout.org_data_id;
				if (!payoutsByOrgData.has(orgDataId)) {
					payoutsByOrgData.set(orgDataId, []);
				}
				payoutsByOrgData.get(orgDataId)!.push({
					...payout,
					employee: payout.profiles || null
				});
			}
		}

		// Build bonus history items
		const bonusHistory: BonusHistoryItem[] = bonusOrgData
			.filter((item: any) => item.bonus_periods) // Only include items with valid period
			.map((item: any) => ({
				period: item.bonus_periods,
				orgData: {
					id: item.id,
					period_id: item.period_id,
					org_id: item.org_id,
					current_kilos: item.current_kilos,
					previous_kilos: item.previous_kilos,
					kilo_difference: item.kilo_difference,
					percentage_change: item.percentage_change,
					above_network_average: item.above_network_average,
					base_bonus: item.base_bonus,
					multiplier: item.multiplier,
					final_bonus: item.final_bonus,
					total_bonus_pool: item.total_bonus_pool,
					total_hours_worked: item.total_hours_worked,
					created_at: item.created_at,
					updated_at: item.updated_at
				},
				payouts: payoutsByOrgData.get(item.id) || []
			}));

		// Sort by year and quarter descending
		bonusHistory.sort((a, b) => {
			if (b.period.year !== a.period.year) {
				return b.period.year - a.period.year;
			}
			return b.period.quarter - a.period.quarter;
		});

		return bonusHistory;
	} catch (err) {
		console.error('[OrganizationDetail] Error in fetchBonusHistory:', err);
		return [];
	}
}
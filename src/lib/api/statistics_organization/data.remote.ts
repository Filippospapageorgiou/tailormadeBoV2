import { query, command } from '$app/server';
import type { BonusOrganizationData } from '$lib/models/bonus_organization.types';
import type { Organization } from '$lib/models/database.types';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { createServerClient } from '$lib/supabase/server';
import { number, z } from 'zod/v4';

const todayTasksStatsSchema = z.object({});

export const getTodayTasksStats = query(async () => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]);

		const today = new Date().toISOString().split('T')[0];

		// Get all tasks for today
		const { data: tasks, error } = await supabase
			.from('user_daily_tasks')
			.select('id, user_id, completed')
			.eq('task_date', today);

		if (error) {
			console.error('[getTodayTasksStats] Error:', error);
			return {
				success: false,
				stats: null,
				message: 'Σφάλμα κατά την ανάκτηση στατιστικών'
			};
		}

		if (!tasks || tasks.length === 0) {
			return {
				success: true,
				stats: {
					totalTasks: 0,
					completedTasks: 0,
					completionRate: 0,
					totalUsersWithTasks: 0,
					usersWhoCompleted: 0,
					engagementRate: 0
				},
				message: 'Δεν υπάρχουν tasks για σήμερα'
			};
		}

		// Calculate task stats
		const totalTasks = tasks.length;
		const completedTasks = tasks.filter((t) => t.completed).length;
		const completionRate = Math.round((completedTasks / totalTasks) * 100);

		// Calculate user stats
		const uniqueUsers = new Set(tasks.map((t) => t.user_id));
		const totalUsersWithTasks = uniqueUsers.size;

		// Users who completed at least one task
		const usersWithCompletedTasks = new Set(tasks.filter((t) => t.completed).map((t) => t.user_id));
		const usersWhoCompleted = usersWithCompletedTasks.size;
		const engagementRate = Math.round((usersWhoCompleted / totalUsersWithTasks) * 100);

		return {
			success: true,
			stats: {
				totalTasks,
				completedTasks,
				completionRate,
				totalUsersWithTasks,
				usersWhoCompleted,
				engagementRate
			},
			message: 'Επιτυχής ανάκτηση στατιστικών'
		};
	} catch (err) {
		console.error('[getTodayTasksStats] Error:', err);
		return {
			success: false,
			stats: null,
			message: 'Σφάλμα κατά την ανάκτηση στατιστικών'
		};
	}
});

// Get daily register closings grouped by org
const dayliRegisterSchema = z.object({
	date: z.string()
});

export const getAllRegisterClosingDate = query(dayliRegisterSchema, async ({ date }) => {
	const supabase = createServerClient();
	try {
		const { data, error } = await supabase
			.rpc('get_daily_register_closings', { p_date: date });

		if (error){
			console.error('[getAllRegisterClosingDate] error fetching daily register data: ', error);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση δεδομένων',
				data:null
			}
		};

		return {
			success: true,
			data
		};
	} catch (err) {
		console.error('[getAllRegisterClosingDate] error fetching daily register data: ', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ανάκτηση δεδομένων',
			data:null
		};
	}
});


export const getAllEquipmentsOverview = query(async () => {
	const supabase = createServerClient();
	try {
		const { data: equipments, error } = await supabase
			.from('equipment')
			.select('id, status, next_service_date, org_id, core_organizations(store_name)');

		if (error) {
			console.error('[getAllEquipmentsOverview] Error:', error);
			return {
				success: false,
				stats: null,
				message: 'Σφάλμα κατά την ανάκτηση εξοπλισμού'
			};
		}

		if (!equipments || equipments.length === 0) {
			return {
				success: true,
				stats: {
					total: 0,
					byStatus: { operational: 0, maintenance: 0, broken: 0 },
					byServiceStatus: { good: 0, warning: 0, overdue: 0 },
					totalOrgs: 0
				},
				message: 'Δεν υπάρχει εξοπλισμός'
			};
		}

		const today = new Date();

		// Calculate status counts
		const byStatus = {
			operational: equipments.filter((e) => e.status === 'operational').length,
			maintenance: equipments.filter((e) => e.status === 'maintenance').length,
			broken: equipments.filter((e) => e.status === 'broken').length
		};

		// Calculate service status counts
		const byServiceStatus = {
			good: 0,
			warning: 0,
			overdue: 0
		};

		equipments.forEach((e) => {
			if (!e.next_service_date) {
				byServiceStatus.good++; // No service date = assume good
				return;
			}

			const nextService = new Date(e.next_service_date);
			const daysUntil = Math.ceil(
				(nextService.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
			);

			if (daysUntil < 0) {
				byServiceStatus.overdue++;
			} else if (daysUntil < 14) {
				byServiceStatus.warning++;
			} else {
				byServiceStatus.good++;
			}
		});

		// Count unique orgs
		const uniqueOrgs = new Set(equipments.map((e) => e.org_id));

		return {
			success: true,
			stats: {
				total: equipments.length,
				byStatus,
				byServiceStatus,
				totalOrgs: uniqueOrgs.size
			},
			message: 'Επιτυχής ανάκτηση στατιστικών εξοπλισμού'
		};
	} catch (err) {
		console.error('[getAllEquipmentsOverview] Error:', err);
		return {
			success: false,
			stats: null,
			message: 'Σφάλμα κατά την ανάκτηση εξοπλισμού'
		};
	}
});

// data.remote.ts - προσθήκη

export const getLeaderboards = query(async () => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]); // super_admin only

		// Top 5 Organizations - συνολικό percentage_change από όλα τα quarters
		const { data: topOrgs, error: orgsError } = await supabase
			.from('bonus_organization_data')
			.select(
				`
				org_id,
				percentage_change,
				total_bonus_pool,
				core_organizations(store_name)
			`
			)
			.order('percentage_change', { ascending: false });

		if (orgsError) {
			console.error('[getLeaderboards] Orgs error:', orgsError);
			return { success: false, topOrganizations: [], topEmployees: [], message: 'Σφάλμα' };
		}

		// Aggregate by org_id - sum of percentage_change across all periods
		const orgMap = new Map<
			number,
			{
				org_id: number;
				store_name: string;
				total_percentage: number;
				total_bonus: number;
				periods_count: number;
			}
		>();

		topOrgs?.forEach((row) => {
			const existing = orgMap.get(row.org_id);
			
			// Fix: core_organizations is an array, so we access the first element [0]
			const orgName = Array.isArray(row.core_organizations) 
				? row.core_organizations[0]?.store_name 
				: (row.core_organizations as any)?.store_name;

			if (existing) {
				existing.total_percentage += Number(row.percentage_change) || 0;
				existing.total_bonus += Number(row.total_bonus_pool) || 0;
				existing.periods_count += 1;
			} else {
				orgMap.set(row.org_id, {
					org_id: row.org_id,
					store_name: orgName || `Org #${row.org_id}`,
					total_percentage: Number(row.percentage_change) || 0,
					total_bonus: Number(row.total_bonus_pool) || 0,
					periods_count: 1
				});
			}
		});

		// Calculate average percentage and sort
		const topOrganizations = Array.from(orgMap.values())
			.map((org) => ({
				...org,
				avg_percentage: Math.round((org.total_percentage / org.periods_count) * 100) / 100
			}))
			.sort((a, b) => b.avg_percentage - a.avg_percentage)
			.slice(0, 5);

		// Top 5 Employees - συνολικό bonus_amount από όλα τα quarters
		const { data: topEmps, error: empsError } = await supabase
			.from('bonus_employee_payouts')
			.select(
				`
				user_id,
				bonus_amount,
				profiles(username, image_url)
			`
			)
			.gt('bonus_amount', 0);

		if (empsError) {
			console.error('[getLeaderboards] Employees error:', empsError);
			return { success: false, topOrganizations, topEmployees: [], message: 'Σφάλμα' };
		}

		// Aggregate by user_id
		const empMap = new Map<
			string,
			{
				user_id: string;
				username: string;
				image_url: string | null;
				total_bonus: number;
				payouts_count: number;
			}
		>();

		topEmps?.forEach((row) => {
			const existing = empMap.get(row.user_id);

			// FIX: Extract the single profile object from the array
			const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

			if (existing) {
				existing.total_bonus += Number(row.bonus_amount) || 0;
				existing.payouts_count += 1;
			} else {
				empMap.set(row.user_id, {
					user_id: row.user_id,
					// Use the 'profile' variable here
					username: profile?.username || 'Unknown',
					image_url: profile?.image_url || null,
					total_bonus: Number(row.bonus_amount) || 0,
					payouts_count: 1
				});
			}
		});

		const topEmployees = Array.from(empMap.values())
			.sort((a, b) => b.total_bonus - a.total_bonus)
			.slice(0, 5);

		return {
			success: true,
			topOrganizations,
			topEmployees,
			message: 'Επιτυχής ανάκτηση leaderboards'
		};
	} catch (err) {
		console.error('[getLeaderboards] Error:', err);
		return {
			success: false,
			topOrganizations: [],
			topEmployees: [],
			message: 'Σφάλμα κατά την ανάκτηση leaderboards'
		};
	}
});

export const getAllOrganizations = query(async () => {
	const supabase = createServerClient();

	try {
		// Get organizations with counts
		const { data: organizations, error: orgsError } = await supabase.from('core_organizations')
			.select(`
				*,
				profiles(count),
				equipment(count)
			`);

		if (orgsError) {
			console.error('[getAllOrganizations] Error:', orgsError);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση οργανισμών',
				organizations: []
			};
		}

		// Get latest bonus data for each organization
		// This gets the most recent period's data per org
		const { data: latestBonusData, error: bonusError } = await supabase
			.from('bonus_organization_data')
			.select(`
				org_id,
				percentage_change,
				bonus_periods!inner(year, quarter)
			`)
			.order('bonus_periods(year)', { ascending: false })
			.order('bonus_periods(quarter)', { ascending: false });

		if (bonusError) {
			console.error('[getAllOrganizations] Bonus data error:', bonusError);
			// Don't fail - just continue without bonus data
		}

		// Create a map of org_id -> latest percentage_change
		const latestPercentageMap = new Map<number, number>();
		
		if (latestBonusData) {
			for (const item of latestBonusData) {
				// Only keep the first (latest) entry per org
				if (!latestPercentageMap.has(item.org_id)) {
					const percentage = typeof item.percentage_change === 'string'
						? parseFloat(item.percentage_change)
						: item.percentage_change;
					latestPercentageMap.set(item.org_id, percentage);
				}
			}
		}

		// Transform with counts and latest percentage
		const orgsWithCounts =
			organizations?.map((org) => ({
				...org,
				employee_count: org.profiles?.[0]?.count ?? 0,
				equipment_count: org.equipment?.[0]?.count ?? 0,
				latest_percentage_change: latestPercentageMap.get(org.id) ?? null
			})) ?? [];

		return {
			success: true,
			organizations: orgsWithCounts
		};
	} catch (err) {
		console.error('[getAllOrganizations] Unexpected error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ανάκτηση οργανισμών',
			organizations: []
		};
	}
});

const orgBonusDataSchema = z.object({
	id: z.number()
});

export const getOrganizationBonusData = query(orgBonusDataSchema, async ({ id }) => {
	const supabase = createServerClient();
	try {
		console.log('starting')
		const { data, error } = await supabase
			.from('bonus_organization_data')
			.select(`
				*,
				bonus_periods!inner (
					quarter,
					year
				)
			`)
			.eq('org_id', id)
			.order('bonus_periods(year)', { ascending: true })
			.order('bonus_periods(quarter)', { ascending: true });

		if (error) {
			console.error('[getOrganizationBonusData] Unexpected error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση δεδομένων',
				data: []
			};
		}
		return {
			success: true,
			message: 'Επιτυχής ανάκτηση δεδομένων',
			data: data ?? []
		};
	} catch (err) {
		console.error('[getOrganizationBonusData] Unexpected error:', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ανάκτηση δεδομένων',
			data: []
		};
	}
});
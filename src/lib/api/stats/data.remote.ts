import { query } from '$app/server';
import { getUserProfile } from '$lib/supabase/queries';
import { createServerClient } from '$lib/supabase/server';

interface StatsResponse {
	success: boolean;
	message?: string;
	data?: {
		// Shifts από την τελευταία εβδομάδα για τον χρήστη
		userShifts: {
			totalShifts: number;
			totalHours: number;
			shifts: Array<{
				id: number;
				shift_date: string;
				start_time: string;
				end_time: string;
				shift_type: string;
			}>;
		};
		// Equipment grouped by status
		equipment: {
			operational: number;
			broken: number;
			maintenance: number;
			total: number;
		};
		// Employees στον ίδιο οργανισμό
		employees: {
			total: number;
			list: Array<{
				id: string;
				full_name: string;
				role: string;
				image_url: string | null;
			}>;
		};
	};
}

export const getAllStatsForCards = query(async (): Promise<StatsResponse> => {
	const supabase = createServerClient();

	try {
		const profile = await getUserProfile();

		if (!profile || !profile.org_id) {
			return {
				success: false,
				message: 'Δεν βρέθηκε προφίλ χρήστη ή οργανισμός'
			};
		}

		const orgId = profile.org_id;
		const userId = profile.id;

		const { data: schedule, error: errorSchedule } = await supabase
			.from('weekly_schedules')
			.select('id')
			.eq('status', 'published')
			.eq('org_id', orgId)
			.order('week_start_date', { ascending: false }) // most recent
			.limit(1)
			.maybeSingle();

		if (errorSchedule) {
			console.error('[getAllStatsForCards] Schedule error:', errorSchedule);
			return {
				success: false,
				message: 'Δεν βρέθηκε προφίλ χρήστη ή οργανισμός'
			};
		}

		// 🔄 Parallel fetching - όλα τα queries ταυτόχρονα!
		const [shiftsResult, equipmentResult, employeesResult] = await Promise.all([
			// 1️⃣ Shifts τελευταίας εβδομάδας για τον χρήστη
			schedule?.id
				? supabase
						.from('shifts')
						.select('id, shift_date, start_time, end_time, shift_type, break_duration_minutes')
						.eq('org_id', orgId)
						.eq('user_id', userId)
						.eq('shift_type', 'work')
						.eq('schedule_id', schedule.id)
						.order('shift_date', { ascending: false })
				: Promise.resolve({ data: [], error: null }),

			// 2️⃣ Equipment grouped by status
			supabase.from('equipment').select('id, status').eq('org_id', orgId),

			// 3️⃣ Employees στον οργανισμό
			supabase.from('profiles').select('id, full_name, role, image_url').eq('org_id', orgId)
		]);

		// Error handling
		if (shiftsResult.error) {
			console.error('[getAllStatsForCards] Shifts error:', shiftsResult.error);
			throw shiftsResult.error;
		}
		if (equipmentResult.error) {
			console.error('[getAllStatsForCards] Equipment error:', equipmentResult.error);
			throw equipmentResult.error;
		}
		if (employeesResult.error) {
			console.error('[getAllStatsForCards] Employees error:', employeesResult.error);
			throw employeesResult.error;
		}

		// 📊 Process shifts data
		const shifts = shiftsResult.data || [];
		let totalHours = 0;

		shifts.forEach((shift) => {
			if (shift.start_time && shift.end_time) {
				const start = new Date(`1970-01-01T${shift.start_time}`);
				const end = new Date(`1970-01-01T${shift.end_time}`);
				let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

				// Αν το end είναι μικρότερο από start, σημαίνει νυχτερινή βάρδια
				if (hours < 0) hours += 24;

				// Αφαίρεση διαλείμματος
				const breakHours = (shift.break_duration_minutes || 0) / 60;
				totalHours += hours - breakHours;
			}
		});

		// 📊 Process equipment data - group by status
		const equipment = equipmentResult.data || [];
		const equipmentStats = {
			operational: 0,
			broken: 0,
			maintenance: 0,
			total: equipment.length
		};

		equipment.forEach((eq) => {
			if (eq.status === 'operational') equipmentStats.operational++;
			else if (eq.status === 'broken') equipmentStats.broken++;
			else if (eq.status === 'maintenance') equipmentStats.maintenance++;
		});

		// 📊 Process employees data
		const employees = employeesResult.data || [];

		return {
			success: true,
			data: {
				userShifts: {
					totalShifts: shifts.length,
					totalHours: Math.round(totalHours * 10) / 10, // 1 δεκαδικό
					shifts: shifts.map((s) => ({
						id: s.id,
						shift_date: s.shift_date,
						start_time: s.start_time,
						end_time: s.end_time,
						shift_type: s.shift_type
					}))
				},
				equipment: equipmentStats,
				employees: {
					total: employees.length,
					list: employees.map((e) => ({
						id: e.id,
						full_name: e.full_name || 'Άγνωστο',
						role: e.role || 'Χωρίς ρόλο',
						image_url: e.image_url
					}))
				}
			}
		};
	} catch (err) {
		console.error('[getAllStatsForCards] Error fetching data', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ανάκτηση δεδομένων'
		};
	}
});

interface TasksAndBonusesResponse {
	success: boolean;
	message?: string;
	data?: {
		// Tasks για σήμερα
		todayTasks: {
			hasTasks: boolean;
			totalTasks: number;
			completedTasks: number;
			pendingTasks: number;
			completionPercentage: number;
			tasks: Array<{
				id: string;
				title: string;
				description: string | null;
				scheduled_time: string | null;
				requires_photo: boolean;
				completed: boolean;
				completed_at: string | null;
			}>;
		};
		// Top 5 bonuses του χρήστη (μόνο published periods)
		bonuses: {
			hasBonuses: boolean;
			totalEarned: number;
			history: Array<{
				periodId: number;
				quarter: number;
				year: string; // "Q1 2026"
				bonusAmount: number;
				hoursWorked: number;
				percentageShare: number;
				totalShifts: number;
			}>;
		};
	};
}

export const getTasksAndBonuses = query(async (): Promise<TasksAndBonusesResponse> => {
	const supabase = createServerClient();

	try {
		const profile = await getUserProfile();

		if (!profile || !profile.org_id) {
			return {
				success: false,
				message: 'Δεν βρέθηκε προφίλ χρήστη ή οργανισμός'
			};
		}

		const orgId = profile.org_id;
		const userId = profile.id;

		// Σημερινή ημερομηνία (format: YYYY-MM-DD)
		const today = new Date().toISOString().split('T')[0];

		// 🔄 Parallel fetching
		const [tasksResult, bonusesResult] = await Promise.all([
			// 1️⃣ Tasks για σήμερα
			supabase
				.from('user_daily_tasks')
				.select(
					`
					id,
					completed,
					completed_at,
					task_items (
						title,
						description,
						scheduled_time,
						requires_photo
					)
				`
				)
				.eq('user_id', userId)
				.eq('task_date', today)
				.order('task_items(scheduled_time)', { ascending: true }),

			// 2️⃣ Top 5 bonuses (μόνο published periods)
			supabase
				.from('bonus_employee_payouts')
				.select(
					`
					id,
					bonus_amount,
					hours_worked,
					percentage_share,
					total_shifts_in_pool,
					created_at,
					bonus_organization_data!inner (
						period_id,
						org_id,
						bonus_periods!inner (
							id,
							quarter,
							year,
							status
						)
					)
				`
				)
				.eq('user_id', userId)
				.eq('bonus_organization_data.org_id', orgId)
				.eq('bonus_organization_data.bonus_periods.status', 'published')
				.order('created_at', { ascending: false })
				.limit(5)
		]);

		// Error handling
		if (tasksResult.error) {
			console.error('[getTasksAndBonuses] Tasks error:', tasksResult.error);
			throw tasksResult.error;
		}

		// Bonus error is not critical - user might not have any bonuses
		if (bonusesResult.error) {
			console.error('[getTasksAndBonuses] Bonuses error:', bonusesResult.error);
			// Don't throw, just continue with empty bonuses
		}

		// 📊 Process tasks data
		const tasks = tasksResult.data || [];
		const completedCount = tasks.filter((t) => t.completed).length;
		const pendingCount = tasks.length - completedCount;

		const processedTasks = tasks.map((task) => ({
			id: task.id,
			title: (task.task_items as any)?.title || 'Άγνωστο task',
			description: (task.task_items as any)?.description || null,
			scheduled_time: (task.task_items as any)?.scheduled_time || null,
			requires_photo: (task.task_items as any)?.requires_photo || false,
			completed: task.completed,
			completed_at: task.completed_at
		}));

		// Sort by scheduled_time
		processedTasks.sort((a, b) => {
			if (!a.scheduled_time) return 1;
			if (!b.scheduled_time) return -1;
			return a.scheduled_time.localeCompare(b.scheduled_time);
		});

		// 📊 Process bonuses data
		const bonuses = bonusesResult.data || [];
		let totalEarned = 0;

		const processedBonuses = bonuses
			.map((bonus) => {
				const amount = parseFloat(bonus.bonus_amount as string) || 0;
				totalEarned += amount;

				const periodData = (bonus.bonus_organization_data as any)?.bonus_periods;

				return {
					periodId: periodData?.id || 0,
					quarter: periodData?.quarter || 0,
					yearNum: periodData?.year || 0,
					year: `Q${periodData?.quarter || '?'} ${periodData?.year || '????'}`,
					bonusAmount: Math.round(amount * 100) / 100,
					hoursWorked: parseFloat(bonus.hours_worked as string) || 0,
					percentageShare: parseFloat(bonus.percentage_share as string) || 0,
					totalShifts: bonus.total_shifts_in_pool || 0
				};
			})
			// Sort by year DESC, then quarter DESC
			.sort((a, b) => {
				if (b.yearNum !== a.yearNum) return b.yearNum - a.yearNum;
				return b.quarter - a.quarter;
			})
			.slice(0, 5); // Take top 5

		// Recalculate total from sorted/sliced results
		totalEarned = processedBonuses.reduce((sum, b) => sum + b.bonusAmount, 0);

		return {
			success: true,
			data: {
				todayTasks: {
					hasTasks: tasks.length > 0,
					totalTasks: tasks.length,
					completedTasks: completedCount,
					pendingTasks: pendingCount,
					completionPercentage:
						tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0,
					tasks: processedTasks
				},
				bonuses: {
					hasBonuses: bonuses.length > 0,
					totalEarned: Math.round(totalEarned * 100) / 100,
					history: processedBonuses
				}
			}
		};
	} catch (err) {
		console.error('[getTasksAndBonuses] Error fetching data', err);
		return {
			success: false,
			message: 'Σφάλμα κατά την ανάκτηση δεδομένων'
		};
	}
});

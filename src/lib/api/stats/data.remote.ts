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

				totalHours += hours
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

interface TaskSummary {
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
}

interface TasksAndBonusesResponse {
	success: boolean;
	message?: string;
	data?: {
		todayTasks: TaskSummary;
		weeklyTasks: TaskSummary;
		monthlyTasks: TaskSummary;
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

function getWeekSearchRange(dateStr: string): { rangeStart: string; rangeEnd: string } {
	const d = new Date(dateStr);
	const sixDaysBefore = new Date(d);
	sixDaysBefore.setDate(d.getDate() - 6);
	return {
		rangeStart: sixDaysBefore.toISOString().split('T')[0],
		rangeEnd: dateStr
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

		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];

		const { rangeStart, rangeEnd } = getWeekSearchRange(todayStr);

		// Month start
		const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

		const taskSelect = `
			id,
			completed,
			completed_at,
			task_items (
				title,
				description,
				scheduled_time,
				requires_photo
			)
		`;

		// 🔄 Parallel fetching
		const [dailyResult, weeklyResult, monthlyResult, bonusesResult] = await Promise.all([
			supabase
				.from('user_daily_tasks')
				.select(taskSelect)
				.eq('user_id', userId)
				.eq('task_date', todayStr)
				.order('task_items(scheduled_time)', { ascending: true }),

			supabase
				.from('user_weekly_tasks')
				.select(taskSelect)
				.eq('user_id', userId)
				.gte('week_start_date', rangeStart)
			.	lte('week_start_date', rangeEnd),

			supabase
				.from('user_monthly_tasks')
				.select(taskSelect)
				.eq('user_id', userId)
				.eq('month_date', monthStartStr),

			supabase
				.from('bonus_employee_payouts')
				.select(`
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
				`)
				.eq('user_id', userId)
				.eq('bonus_organization_data.org_id', orgId)
				.eq('bonus_organization_data.bonus_periods.status', 'published')
				.order('created_at', { ascending: false })
				.limit(5)
		]);

		if (dailyResult.error) throw dailyResult.error;
		if (weeklyResult.error) console.error('[getTasksAndBonuses] Weekly tasks error:', weeklyResult.error);
		if (monthlyResult.error) console.error('[getTasksAndBonuses] Monthly tasks error:', monthlyResult.error);
		if (bonusesResult.error) console.error('[getTasksAndBonuses] Bonuses error:', bonusesResult.error);

		// Helper to process tasks
		function processTasks(tasks: any[]) {
			const completedCount = tasks.filter((t) => t.completed).length;
			const processed = tasks
				.map((task) => ({
					id: task.id,
					title: task.task_items?.title || 'Άγνωστο task',
					description: task.task_items?.description || null,
					scheduled_time: task.task_items?.scheduled_time || null,
					requires_photo: task.task_items?.requires_photo || false,
					completed: task.completed,
					completed_at: task.completed_at
				}))
				.sort((a, b) => {
					if (!a.scheduled_time) return 1;
					if (!b.scheduled_time) return -1;
					return a.scheduled_time.localeCompare(b.scheduled_time);
				});

			return {
				hasTasks: tasks.length > 0,
				totalTasks: tasks.length,
				completedTasks: completedCount,
				pendingTasks: tasks.length - completedCount,
				completionPercentage:
					tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0,
				tasks: processed
			};
		}

		// 📊 Process bonuses
		const bonuses = bonusesResult.data || [];
		const processedBonuses = bonuses
			.map((bonus) => {
				const amount = parseFloat(bonus.bonus_amount as string) || 0;
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
			.sort((a, b) => b.yearNum !== a.yearNum ? b.yearNum - a.yearNum : b.quarter - a.quarter)
			.slice(0, 5);

		const totalEarned = processedBonuses.reduce((sum, b) => sum + b.bonusAmount, 0);

		return {
			success: true,
			data: {
				todayTasks: processTasks(dailyResult.data || []),
				weeklyTasks: processTasks(weeklyResult.data || []),
				monthlyTasks: processTasks(monthlyResult.data || []),
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

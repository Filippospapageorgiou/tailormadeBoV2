<script lang="ts">
	import StatsGrid from './StatsGrid.svelte';
	import EvaluationsChart from './evalution-chart.svelte';
	import TopPerformersCard from './TopPerformersCard.svelte';
	import {
		getTrainerManagementStats,
		getTrainers,
		getEvaluations
	} from '$lib/api/trainers/trainer_managment/data.remote';

	let { isRefreshing = $bindable(), trainers } = $props();

	let stats = getTrainerManagementStats();
	let trainersQuery = getTrainers();
	let evaluationsQuery = getEvaluations();

	$effect(() => {
		if (isRefreshing) {
			refresh();
		}
	});

	async function refresh() {
		await stats.refresh();
		await trainersQuery.refresh();
		await evaluationsQuery.refresh();
		isRefreshing = false;
	}

	// Build chart data: evaluations grouped by month
	let chartData = $derived.by(() => {
		const evals = evaluationsQuery?.current?.evaluations ?? [];
		if (evals.length === 0) return [];

		const monthMap = new Map<string, { submitted: number; reviewed: number }>();

		// Greek month abbreviations
		const monthLabels = [
			'Ιαν',
			'Φεβ',
			'Μαρ',
			'Απρ',
			'Μάι',
			'Ιούν',
			'Ιούλ',
			'Αύγ',
			'Σεπ',
			'Οκτ',
			'Νοε',
			'Δεκ'
		];

		evals.forEach((e) => {
			const date = new Date(e.visit_date);
			const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			const label = `${monthLabels[date.getMonth()]} '${String(date.getFullYear()).slice(-2)}`;

			if (!monthMap.has(key)) {
				monthMap.set(key, { submitted: 0, reviewed: 0 });
			}
			const entry = monthMap.get(key)!;

			if (e.submit === 'submitted' || e.submit === 'reviewed' || e.submit === 'reopened') {
				entry.submitted++;
			}
			if (e.submit === 'reviewed') {
				entry.reviewed++;
			}
		});

		return Array.from(monthMap.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.slice(-8) // last 8 months
			.map(([key, counts]) => {
				const [year, month] = key.split('-');
				const monthLabels2 = [
					'Ιαν',
					'Φεβ',
					'Μαρ',
					'Απρ',
					'Μάι',
					'Ιούν',
					'Ιούλ',
					'Αύγ',
					'Σεπ',
					'Οκτ',
					'Νοε',
					'Δεκ'
				];
				return {
					month: `${monthLabels2[parseInt(month) - 1]} '${year.slice(-2)}`,
					...counts
				};
			});
	});

	// Evaluation count map (shared between trainerListData and topTrainers)
	let evalCountMap = $derived.by(() => {
		const evals = evaluationsQuery.current?.evaluations ?? [];
		const countMap = new Map<string, number>();
		evals.forEach((e) => {
			countMap.set(e.trainer_id, (countMap.get(e.trainer_id) ?? 0) + 1);
		});
		return countMap;
	});

	// Full trainer list with phone + eval count for StatsGrid
	let trainerListData = $derived.by(() => {
		const trainers = trainersQuery.current?.trainers ?? [];
		return trainers.map((t: any) => ({
			id: t.id,
			full_name: t.full_name,
			username: t.username,
			image_url: t.image_url,
			email: t.email ?? null,
			phone: t.phone ?? null,
			evaluation_count: evalCountMap.get(t.id) ?? 0
		}));
	});

	// Build top performers: trainers ranked by evaluation count
	let topTrainers = $derived.by(() => {
		const trainers = trainersQuery.current?.trainers ?? [];
		if (trainers.length === 0) return [];

		return trainers
			.map((t: any) => ({
				id: t.id,
				full_name: t.full_name,
				username: t.username,
				image_url: t.image_url,
				evaluation_count: evalCountMap.get(t.id) ?? 0,
				active_assignments: t.trainer_org_assigments?.filter((a: any) => a.is_active).length ?? 0
			}))
			.sort((a: any, b: any) => b.evaluation_count - a.evaluation_count)
			.slice(0, 6);
	});
</script>

<div class="flex flex-col gap-3">
	<!-- Row 1: Stat cards -->
	<StatsGrid trainers={trainerListData} {stats} loading={stats.loading} />

	<!-- Row 2: Chart (left, wider) + Top Performers (right) -->
	<div class="grid grid-cols-1 gap-3 lg:grid-cols-5">
		<div class="lg:col-span-3">
			<EvaluationsChart data={chartData} />
		</div>
		<div class="lg:col-span-2">
			<TopPerformersCard trainers={topTrainers} />
		</div>
	</div>
</div>

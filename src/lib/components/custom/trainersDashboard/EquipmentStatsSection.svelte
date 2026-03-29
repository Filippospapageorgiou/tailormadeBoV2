<script lang="ts">
	import EquipmentStatsGrid from './EquipmentStatsGrid.svelte';
	import EquipmentVisitsChart from './EquipmentVisitsChart.svelte';
	import TopVisitedStoresCard from './TopVisitedStoresCard.svelte';
	import {
		getEquipmentVisitStats,
		getAllEquipmentVisits
	} from '$lib/api/trainers/trainer_managment/data.remote';

	let { isRefreshing = $bindable() } = $props();

	let stats = getEquipmentVisitStats();
	let visitsQuery = getAllEquipmentVisits();

	$effect(() => {
		if (isRefreshing) {
			refresh();
		}
	});

	async function refresh() {
		await stats.refresh();
		await visitsQuery.refresh();
		isRefreshing = false;
	}

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

	// Build chart data: visits + actions grouped by month
	let chartData = $derived.by(() => {
		const visits = visitsQuery?.current?.visits ?? [];
		if (visits.length === 0) return [];

		const monthMap = new Map<string, { visits: number; actions: number }>();

		visits.forEach((v: any) => {
			if (v.status !== 'completed') return;
			const date = new Date(v.visit_date);
			const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

			if (!monthMap.has(key)) {
				monthMap.set(key, { visits: 0, actions: 0 });
			}
			const entry = monthMap.get(key)!;
			entry.visits++;
			entry.actions += v.action_count ?? 0;
		});

		return Array.from(monthMap.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.slice(-8)
			.map(([key, counts]) => {
				const [year, month] = key.split('-');
				return {
					month: `${monthLabels[parseInt(month) - 1]} '${year.slice(-2)}`,
					...counts
				};
			});
	});

	// Build top visited stores
	let topStores = $derived.by(() => {
		const visits = visitsQuery?.current?.visits ?? [];
		if (visits.length === 0) return [];

		const storeMap = new Map<
			number,
			{ store_name: string; location: string | null; visit_count: number; total_actions: number }
		>();

		visits.forEach((v: any) => {
			if (v.status !== 'completed') return;
			const orgId = v.core_organizations?.id ?? v.org_id;
			const existing = storeMap.get(orgId);

			if (existing) {
				existing.visit_count++;
				existing.total_actions += v.action_count ?? 0;
			} else {
				storeMap.set(orgId, {
					store_name: v.core_organizations?.store_name ?? 'Άγνωστο',
					location: v.core_organizations?.location ?? null,
					visit_count: 1,
					total_actions: v.action_count ?? 0
				});
			}
		});

		return Array.from(storeMap.entries())
			.map(([org_id, data]) => ({ org_id, ...data }))
			.sort((a, b) => b.visit_count - a.visit_count)
			.slice(0, 6);
	});
</script>

<div class="flex flex-col gap-3">
	<!-- Row 1: Stat cards -->
	<EquipmentStatsGrid {stats} loading={stats.loading} />

	<!-- Row 2: Chart (left, wider) + Top Stores (right) -->
	<div class="grid grid-cols-1 gap-3 lg:grid-cols-5">
		<div class="lg:col-span-3">
			<EquipmentVisitsChart data={chartData} />
		</div>
		<div class="lg:col-span-2">
			<TopVisitedStoresCard stores={topStores} />
		</div>
	</div>
</div>

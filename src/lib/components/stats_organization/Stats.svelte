<script lang="ts">
	import { getAllBonusPeriods } from '$lib/api/bonus_managment/data.remote';
	import {
		getAllEquipmentsOverview,
		getTodayTasksStats,
		getAllOrganizations,
		getAllRegisterClosingDate
	} from '$lib/api/statistics_organization/data.remote';
	import { getLeaderboards } from '$lib/api/statistics_organization/data.remote';
	import BarChartBonus from './BarChartBonus.svelte';
	import PieChartEquipments from './PieChartEquipments.svelte';
	import TasksChart from './TasksChart.svelte';
	import LeaderboardsStats from './LeaderboardsStats.svelte';
	import CustomMap from './CustomMap.svelte';
	import BarChartRegisterClosing from './BarChartRegisterClosing.svelte';

	let query = getAllBonusPeriods();
	let queryTasks = getTodayTasksStats();
	let queryEquipments = getAllEquipmentsOverview();
	let queryLeaderboards = getLeaderboards();
	let queryAllOrgs = getAllOrganizations();
	let queryRegisterClosings = getAllRegisterClosingDate({
		date: new Date().toISOString().split('T')[0] // '2026-02-12'
	});

	let isLoading = $state(false);
	async function handleRefresh() {
		isLoading = true;
		await queryTasks.refresh();
		isLoading = false;
	}

	let isLoadingEq = $state(false);
	async function handleRefreshEq() {
		isLoadingEq = true;
		await queryEquipments.refresh();
		isLoadingEq = false;
	}

	let isLoadingRegister = $state(false);
	async function handleRefreshRegister() {
		isLoadingRegister = true;
		await queryRegisterClosings.refresh();
		isLoadingRegister = false;
	}
</script>

<div class="mx-4 flex flex-col gap-4 h-full">
	<BarChartRegisterClosing data={queryRegisterClosings.current?.data} />
	<!-- Responsive Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
		<!-- Bonus Chart - Full width mobile, 3 cols desktop -->
		<div class="md:col-span-2 lg:col-span-3 lg:row-span-2">
			<BarChartBonus bonusPeriods={query.current?.periods} />
		</div>
		
		<!-- Tasks Chart - Full width mobile, 2 cols desktop -->
		<div class="md:col-span-2 lg:col-span-2 lg:row-span-2">
			<TasksChart 
				stats={queryTasks.current?.stats!} 
				onRefresh={handleRefresh} 
				isLoading={isLoading}
			/>
		</div>
		
		<!-- Pie Chart - Full width mobile, 2 cols desktop -->
		<div class="md:col-span-1 lg:col-span-2 lg:row-span-2">
			<PieChartEquipments
				stats={queryEquipments?.current?.stats!}
				onRefresh={handleRefreshEq}
				isLoading={isLoadingEq}
			/>
		</div>
		
		<!-- Leaderboards - Full width mobile, 3 cols desktop -->
		<div class="md:col-span-1 lg:col-span-3 lg:row-span-2">
			<LeaderboardsStats 
				topOrganizations={queryLeaderboards.current?.topOrganizations ?? []}
				topEmployees={queryLeaderboards.current?.topEmployees ?? []}
			/>
		</div>
	</div>
	
	<!-- Map - Responsive height -->
	<div class="h-[400px] md:h-[500px] lg:h-[600px] py-4">
		<CustomMap organizations={queryAllOrgs.current?.organizations ?? []} />
	</div>
</div>
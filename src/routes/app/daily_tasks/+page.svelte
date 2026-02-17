<script lang="ts">
	import {
		getDailyTasksForUser,
		getWeeklyTasksForUser,
		getMonthlyTasksForUser
	} from './data.remote';
	import TaskHeader from './components/task-header.svelte';
	import TaskList from './dnd_components/task-list.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';
	import { ListChecks } from 'lucide-svelte';

	type Frequency = 'daily' | 'weekly' | 'monthly';

	// ─── Queries (all load on mount) ───
	let dailyQuery = getDailyTasksForUser();
	let weeklyQuery = getWeeklyTasksForUser();
	let monthlyQuery = getMonthlyTasksForUser();

	let dailyTasks = $derived(dailyQuery.current?.tasks ?? []);
	let weeklyTasks = $derived(weeklyQuery.current?.tasks ?? []);
	let monthlyTasks = $derived(monthlyQuery.current?.tasks ?? []);

	// ─── Active tab ───
	let selectedFrequency = $state<Frequency>('daily');

	// ─── Active tasks based on tab ───
	let activeTasks = $derived(
		selectedFrequency === 'daily'
			? dailyTasks
			: selectedFrequency === 'weekly'
				? weeklyTasks
				: monthlyTasks
	);

	let isLoading = $derived(
		selectedFrequency === 'daily'
			? dailyQuery.loading
			: selectedFrequency === 'weekly'
				? weeklyQuery.loading
				: monthlyQuery.loading
	);

	// ─── Per-frequency stats (for tab badges) ───
	function getFreqStats(tasks: any[]) {
		const total = tasks.length;
		const completed = tasks.filter((t) => t.completed).length;
		return { total, completed };
	}

	let dailyStats = $derived(getFreqStats(dailyTasks));
	let weeklyStats = $derived(getFreqStats(weeklyTasks));
	let monthlyStats = $derived(getFreqStats(monthlyTasks));

	// ─── Combined stats ───
	let combinedStats = $derived.by(() => {
		const all = [...dailyTasks, ...weeklyTasks, ...monthlyTasks];
		const total = all.length;
		const completed = all.filter((t) => t.completed).length;
		const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
		const totalMinutes = all.reduce(
			(sum, t) => sum + (t.task_items?.estimated_minutes || 0),
			0
		);
		return { total, completed, progress, totalMinutes };
	});

	// ─── Refresh ───
	function refresh() {
		if (selectedFrequency === 'daily') dailyQuery.refresh();
		else if (selectedFrequency === 'weekly') weeklyQuery.refresh();
		else monthlyQuery.refresh();
	}

	// ─── Frequency config ───
	const freqConfig: Record<Frequency, { periodLabel: string; emptyTitle: string; emptyDesc: string }> = {
		daily: {
			periodLabel: 'Σήμερα',
			emptyTitle: 'Δεν υπάρχουν ημερήσιες εργασίες',
			emptyDesc: 'Δεν σας έχουν ανατεθεί εργασίες για σήμερα'
		},
		weekly: {
			periodLabel: 'Αυτή την εβδομάδα',
			emptyTitle: 'Δεν υπάρχουν εβδομαδιαίες εργασίες',
			emptyDesc: 'Δεν σας έχουν ανατεθεί εργασίες για αυτή την εβδομάδα'
		},
		monthly: {
			periodLabel: 'Αυτόν τον μήνα',
			emptyTitle: 'Δεν υπάρχουν μηνιαίες εργασίες',
			emptyDesc: 'Δεν σας έχουν ανατεθεί εργασίες για αυτόν τον μήνα'
		}
	};
</script>

<div class="daily-tasks-page min-h-screen bg-background">
	<TaskHeader
		bind:selectedFrequency
		{dailyStats}
		{weeklyStats}
		{monthlyStats}
		{combinedStats}
	/>

	<!-- Task Content -->
	<main class="px-4 pt-5 pb-8 sm:px-6">
		{#if isLoading && activeTasks.length === 0}
			<div class="flex flex-col items-center justify-center gap-3 py-20">
				<Spinner class="h-5 w-5 text-muted-foreground" />
				<p class="text-xs text-muted-foreground">Φόρτωση εργασιών...</p>
			</div>
		{:else if activeTasks.length === 0}
			<div class="animate-in fade-in slide-in-from-bottom-2 duration-500">
				<EmptyComp
					title={freqConfig[selectedFrequency].emptyTitle}
					description={freqConfig[selectedFrequency].emptyDesc}
					icon={ListChecks as any}
					tip="Οι εργασίες ανατίθενται από τον διαχειριστή στις ρυθμίσεις"
				/>
			</div>
		{:else}
			<div class="animate-in fade-in slide-in-from-bottom-3 duration-400">
				<TaskList
					tasks={activeTasks}
					frequency={selectedFrequency}
					onUpdate={refresh}
				/>
			</div>
		{/if}
	</main>
</div>

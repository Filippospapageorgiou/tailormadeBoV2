<script lang="ts">
	import type { Profile } from '$lib/models/database.types';

	interface TaskUserStat {
		userId: string;
		daily: { total: number; completed: number };
		weekly: { total: number; completed: number };
		monthly: { total: number; completed: number };
	}
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { BarChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { ListChecks } from 'lucide-svelte';

	interface Props {
		taskStats: TaskUserStat[];
		employees: Profile[];
	}

	let { taskStats, employees }: Props = $props();

	function getInitials(fullName: string | null, username: string): string {
		if (fullName) {
			return fullName
				.split(' ')
				.slice(0, 2)
				.map((n: string) => n[0])
				.join('')
				.toUpperCase();
		}
		return username.slice(0, 2).toUpperCase();
	}

	let taskSummary = $derived.by(() => {
		let td = 0,
			cd = 0,
			tw = 0,
			cw = 0,
			tm = 0,
			cm = 0;
		for (const ts of taskStats) {
			td += ts.daily.total;
			cd += ts.daily.completed;
			tw += ts.weekly.total;
			cw += ts.weekly.completed;
			tm += ts.monthly.total;
			cm += ts.monthly.completed;
		}
		return {
			daily: { total: td, completed: cd, rate: td > 0 ? Math.round((cd / td) * 100) : 0 },
			weekly: { total: tw, completed: cw, rate: tw > 0 ? Math.round((cw / tw) * 100) : 0 },
			monthly: { total: tm, completed: cm, rate: tm > 0 ? Math.round((cm / tm) * 100) : 0 }
		};
	});

	let taskChartData = $derived(
		taskStats
			.filter((ts) => ts.daily.total > 0)
			.map((ts) => {
				const emp = employees.find((e) => e.id === ts.userId);
				return {
					name: (emp?.full_name ?? emp?.username ?? '?').split(' ')[0],
					completed: ts.daily.completed,
					remaining: ts.daily.total - ts.daily.completed
				};
			})
	);

	const taskChartConfig = {
		completed: { label: 'Done', color: 'var(--chart-2)' },
		remaining: { label: 'Pending', color: 'var(--chart-4)' }
	} satisfies Chart.ChartConfig;
</script>

<!-- Summary KPI cards: Daily / Weekly / Monthly -->
<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
	<!-- Daily -->
	<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
		<Card.Content class="p-4">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Today — Daily
				</p>
				<Badge variant="secondary" class="text-[10px]">{taskSummary.daily.rate}%</Badge>
			</div>
			<p class="mt-2 text-3xl font-bold tabular-nums">
				{taskSummary.daily.completed}<span class="text-base font-normal text-muted-foreground"
					>/{taskSummary.daily.total}</span
				>
			</p>
			<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full bg-emerald-500 transition-all duration-500"
					style="width: {taskSummary.daily.rate}%"
				></div>
			</div>
			<p class="mt-1.5 text-[11px] text-muted-foreground">
				{taskSummary.daily.total - taskSummary.daily.completed} tasks still pending
			</p>
		</Card.Content>
	</Card.Root>

	<!-- Weekly -->
	<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
		<Card.Content class="p-4">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					This Week — Weekly
				</p>
				<Badge variant="secondary" class="text-[10px]">{taskSummary.weekly.rate}%</Badge>
			</div>
			<p class="mt-2 text-3xl font-bold tabular-nums">
				{taskSummary.weekly.completed}<span class="text-base font-normal text-muted-foreground"
					>/{taskSummary.weekly.total}</span
				>
			</p>
			<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full bg-blue-500 transition-all duration-500"
					style="width: {taskSummary.weekly.rate}%"
				></div>
			</div>
			<p class="mt-1.5 text-[11px] text-muted-foreground">
				{taskSummary.weekly.total - taskSummary.weekly.completed} tasks still pending
			</p>
		</Card.Content>
	</Card.Root>

	<!-- Monthly -->
	<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
		<Card.Content class="p-4">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					This Month — Monthly
				</p>
				<Badge variant="secondary" class="text-[10px]">{taskSummary.monthly.rate}%</Badge>
			</div>
			<p class="mt-2 text-3xl font-bold tabular-nums">
				{taskSummary.monthly.completed}<span class="text-base font-normal text-muted-foreground"
					>/{taskSummary.monthly.total}</span
				>
			</p>
			<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full bg-indigo-500 transition-all duration-500"
					style="width: {taskSummary.monthly.rate}%"
				></div>
			</div>
			<p class="mt-1.5 text-[11px] text-muted-foreground">
				{taskSummary.monthly.total - taskSummary.monthly.completed} tasks still pending
			</p>
		</Card.Content>
	</Card.Root>
</div>

<!-- Today's completion chart + per-employee table -->
<div class="grid gap-4 lg:grid-cols-5">
	<!-- Stacked bar chart: today's tasks per employee -->
	<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card lg:col-span-2">
		<Card.Header class="px-4 pt-4 pb-2">
			<Card.Title class="text-sm font-medium">Today's Completion</Card.Title>
			<Card.Description class="text-xs">Daily tasks per staff member</Card.Description>
		</Card.Header>
		<Card.Content class="px-4 pb-4">
			{#if taskChartData.length > 0}
				<Chart.Container config={taskChartConfig} class="h-[220px] w-full">
					<BarChart
						data={taskChartData}
						xScale={scaleBand().padding(0.35)}
						x="name"
						axis="x"
						seriesLayout="stack"
						series={[
							{ key: 'completed', label: 'Done', color: taskChartConfig.completed.color },
							{ key: 'remaining', label: 'Pending', color: taskChartConfig.remaining.color }
						]}
						props={{
							bars: { radius: 3 },
							xAxis: { tickLabelProps: { class: 'text-[10px] fill-muted-foreground' } }
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip />
						{/snippet}
					</BarChart>
				</Chart.Container>
			{:else}
				<div class="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
					<div class="text-center">
						<ListChecks class="mx-auto mb-2 h-8 w-8 opacity-30" />
						No daily tasks assigned today
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Per-employee breakdown table -->
	<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card lg:col-span-3">
		<Card.Header class="px-4 pt-4 pb-2">
			<Card.Title class="text-sm font-medium">Per-Employee Breakdown</Card.Title>
			<Card.Description class="text-xs">Daily · Weekly · Monthly (completed/total)</Card.Description
			>
		</Card.Header>
		<Card.Content class="px-0 pb-0">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head>Member</Table.Head>
						<Table.Head class="text-center">Daily</Table.Head>
						<Table.Head class="text-center">Weekly</Table.Head>
						<Table.Head class="text-center">Monthly</Table.Head>
						<Table.Head class="text-center">Overall</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each taskStats as ts (ts.userId)}
						{@const emp = employees.find((e) => e.id === ts.userId)}
						{@const total = ts.daily.total + ts.weekly.total + ts.monthly.total}
						{@const done = ts.daily.completed + ts.weekly.completed + ts.monthly.completed}
						{@const overallRate = total > 0 ? Math.round((done / total) * 100) : null}
						<Table.Row>
							<Table.Cell>
								<div class="flex items-center gap-2">
									<Avatar.Root class="h-7 w-7">
										<Avatar.Image class="dark:bg-white" src={emp?.image_url} />
										<Avatar.Fallback class="text-[10px]">
											{getInitials(emp?.full_name ?? null, emp?.username ?? '?')}
										</Avatar.Fallback>
									</Avatar.Root>
									<p class="text-sm font-medium">
										{emp?.full_name ?? emp?.username ?? '—'}
									</p>
								</div>
							</Table.Cell>
							<Table.Cell class="text-center">
								{#if ts.daily.total > 0}
									<span
										class="text-xs {ts.daily.completed === ts.daily.total
											? 'font-semibold text-emerald-600'
											: ''}"
									>
										{ts.daily.completed}/{ts.daily.total}
									</span>
								{:else}
									<span class="text-xs text-muted-foreground/40">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-center">
								{#if ts.weekly.total > 0}
									<span
										class="text-xs {ts.weekly.completed === ts.weekly.total
											? 'font-semibold text-emerald-600'
											: ''}"
									>
										{ts.weekly.completed}/{ts.weekly.total}
									</span>
								{:else}
									<span class="text-xs text-muted-foreground/40">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-center">
								{#if ts.monthly.total > 0}
									<span
										class="text-xs {ts.monthly.completed === ts.monthly.total
											? 'font-semibold text-emerald-600'
											: ''}"
									>
										{ts.monthly.completed}/{ts.monthly.total}
									</span>
								{:else}
									<span class="text-xs text-muted-foreground/40">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-center">
								{#if overallRate !== null}
									<div class="flex items-center justify-center gap-1.5">
										<div class="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
											<div
												class="h-full rounded-full {overallRate === 100
													? 'bg-emerald-500'
													: overallRate >= 50
														? 'bg-blue-500'
														: 'bg-amber-500'} transition-all"
												style="width: {overallRate}%"
											></div>
										</div>
										<span class="text-xs tabular-nums">{overallRate}%</span>
									</div>
								{:else}
									<span class="text-xs text-muted-foreground/40">—</span>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>

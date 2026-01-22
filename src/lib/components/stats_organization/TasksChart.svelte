<script lang="ts">
	import { ClipboardCheck, Users, RefreshCw } from 'lucide-svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { ArcChart, Text } from 'layerchart';
	import Button from '$lib/components/ui/button/button.svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let {
		stats,
		onRefresh,
		isLoading = false
	} = $props<{
		stats: {
			totalTasks: number;
			completedTasks: number;
			completionRate: number;
			totalUsersWithTasks: number;
			usersWhoCompleted: number;
			engagementRate: number;
		} | null;
		onRefresh?: () => void;
		isLoading?: boolean;
	}>();

	// Chart config
	const chartConfig = {
		completion: {
			label: 'Task Completion',
			color: 'hsl(152 60% 52%)' // Subtle green
		},
		engagement: {
			label: 'User Engagement',
			color: 'hsl(217 70% 60%)' // Subtle blue
		}
	} satisfies Chart.ChartConfig;

	// Chart data for radial arcs
	let chartData = $derived.by(() => {
		if (!stats) return [];

		return [
			{
				key: 'completion',
				label: 'Tasks',
				value: stats.completionRate,
				color: chartConfig.completion.color
			},
			{
				key: 'engagement',
				label: 'Users',
				value: stats.engagementRate,
				color: chartConfig.engagement.color
			}
		];
	});

	// Calculate average for center display
	let averageRate = $derived.by(() => {
		if (!stats) return 0;
		return Math.round((stats.completionRate + stats.engagementRate) / 2);
	});

	// Format today's date
	function formatToday(): string {
		return new Intl.DateTimeFormat('el-GR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		}).format(new Date());
	}
</script>

<Card.Root
	class="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm"
>
	<!-- Subtle gradient background -->
	<div
		class="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5"
	></div>

	<!-- Subtle ambient glow -->
	<div
		class="absolute -top-32 -left-32 -z-10 h-64 w-64 rounded-full bg-emerald-400/8 blur-3xl"
	></div>
	<div
		class="absolute -right-32 -bottom-32 -z-10 h-64 w-64 rounded-full bg-blue-400/8 blur-3xl"
	></div>

	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<div>
				<Card.Title class="text-base">Σημερινή Απόδοση</Card.Title>
				<Card.Description class="text-xs">
					{formatToday()}
				</Card.Description>
			</div>

			<Button variant="ghost" size="icon" class="h-8 w-8" onclick={onRefresh} disabled={isLoading}>
				<RefreshCw class="h-4 w-4 {isLoading ? 'animate-spin-clockwise repeat-infinite' : ''}" />
			</Button>
		</div>
	</Card.Header>

	<Card.Content class="flex-1 pt-4">
		{#if !isLoading && stats && stats.totalTasks > 0}
			<div class="flex items-center gap-8">
				<!-- Radial Chart - Bigger -->
				<div class="flex-shrink-0">
					<Chart.Container config={chartConfig} class="aspect-square h-[180px] w-[180px]">
						<ArcChart
							value="value"
							outerRadius={-10}
							innerRadius={-22}
							padding={16}
							range={[180, -180]}
							maxValue={100}
							series={chartData.map((d) => ({
								key: d.key,
								color: d.color,
								data: [d],
								label: d.label
							}))}
							props={{
								arc: {
									track: { class: 'fill-muted/30' },
									motion: 'tween'
								}
							}}
							tooltip={false}
						>
							{#snippet belowMarks()}
								<circle cx="0" cy="0" r="50" class="fill-card/80" />
							{/snippet}

							{#snippet aboveMarks()}
								<Text
									value="{averageRate}%"
									textAnchor="middle"
									verticalAnchor="middle"
									class="fill-foreground text-2xl! font-bold"
									dy={-4}
								/>
								<Text
									value="Μ.Ο."
									textAnchor="middle"
									verticalAnchor="middle"
									class="fill-muted-foreground text-xs!"
									dy={16}
								/>
							{/snippet}
						</ArcChart>
					</Chart.Container>
				</div>

				<!-- Metrics -->
				<div class="flex flex-1 flex-col gap-5">
					<!-- Task Completion -->
					<div class="flex items-center gap-3">
						<div
							class="h-3.5 w-3.5 rounded-full"
							style="background-color: {chartConfig.completion.color}"
						></div>
						<div class="flex-1">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">Task Completion</span>
								<span class="text-base font-bold">{stats.completionRate}%</span>
							</div>
							<p class="text-xs text-muted-foreground">
								{stats.completedTasks} / {stats.totalTasks} tasks
							</p>
						</div>
					</div>

					<!-- User Engagement -->
					<div class="flex items-center gap-3">
						<div
							class="h-3.5 w-3.5 rounded-full"
							style="background-color: {chartConfig.engagement.color}"
						></div>
						<div class="flex-1">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">User Engagement</span>
								<span class="text-base font-bold">{stats.engagementRate}%</span>
							</div>
							<p class="text-xs text-muted-foreground">
								{stats.usersWhoCompleted} / {stats.totalUsersWithTasks} users
							</p>
						</div>
					</div>
				</div>
			</div>
		{:else if isLoading}
			<div class="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
				<div class="text-center">
					<Spinner />
				</div>
			</div>
		{:else}
			<div class="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
				<div class="text-center">
					<ClipboardCheck class="mx-auto mb-2 h-8 w-8 opacity-50" />
					<p>Δεν υπάρχουν tasks για σήμερα</p>
				</div>
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="border-t border-border/40 pt-4">
		<div class="flex items-center gap-4 text-xs text-muted-foreground">
			<div class="flex items-center gap-1.5">
				<ClipboardCheck class="h-3.5 w-3.5" />
				<span>{stats?.totalTasks ?? 0} tasks</span>
			</div>
			<div class="h-3 w-px bg-border/60"></div>
			<div class="flex items-center gap-1.5">
				<Users class="h-3.5 w-3.5" />
				<span>{stats?.totalUsersWithTasks ?? 0} users</span>
			</div>
		</div>
	</Card.Footer>
</Card.Root>

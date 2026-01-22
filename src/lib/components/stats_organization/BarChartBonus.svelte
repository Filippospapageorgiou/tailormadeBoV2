<script lang="ts">
	import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-svelte';
	import { scaleBand } from 'd3-scale';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { BarChart } from 'layerchart';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	let { bonusPeriods = [] } = $props();

	// Format percentage
	function formatPercentage(value: number): string {
		return `${value.toFixed(2)}%`;
	}

	// Format quarter label
	function formatQuarterLabel(quarter: number, year: number): string {
		return `Q${quarter} ${year}`;
	}

	// Format short quarter (for x-axis)
	function formatShortQuarter(quarter: number, year: number): string {
		return `Q${quarter} '${year.toString().slice(-2)}`;
	}

	// Chart configuration - subtle single color
	const chartConfig = {
		average: {
			label: 'Μέσος Όρος Δικτύου',
			color: 'var(--chart-1)'
		}
	} satisfies Chart.ChartConfig;

	// Transform and sort data chronologically
	let chartData = $derived.by(() => {
		if (!bonusPeriods || bonusPeriods.length === 0) return [];

		// Sort by year and quarter ascending
		const sorted = [...bonusPeriods].sort((a, b) => {
			if (a.year !== b.year) return a.year - b.year;
			return a.quarter - b.quarter;
		});

		return sorted.map((period, index) => {
			const prevPeriod = index > 0 ? sorted[index - 1] : null;
			const trend = prevPeriod 
				? period.network_average_percentage - prevPeriod.network_average_percentage
				: 0;

			return {
				period: formatShortQuarter(period.quarter, period.year),
				fullLabel: formatQuarterLabel(period.quarter, period.year),
				average: period.network_average_percentage,
				trend,
				status: period.status,
				orgCount: period.org_count
			};
		});
	});

	// Calculate overall trend (first to last)
	let overallTrend = $derived.by(() => {
		if (chartData.length < 2) return 0;
		const first = chartData[0].average;
		const last = chartData[chartData.length - 1].average;
		return Number((last - first).toFixed(2));
	});

	// Latest period info
	let latestPeriod = $derived.by(() => {
		if (chartData.length === 0) return null;
		return chartData[chartData.length - 1];
	});

	// Average of all periods
	let totalAverage = $derived.by(() => {
		if (chartData.length === 0) return 0;
		const sum = chartData.reduce((acc, d) => acc + d.average, 0);
		return Number((sum / chartData.length).toFixed(2));
	});
</script>

<Card.Root class="relative flex flex-col rounded-2xl p-6 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-sm">
	<!-- Subtle gradient background - cooler tones -->
	<div class="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-zinc-500/5 -z-10"></div>
	
	<!-- Subtle ambient glow - very muted -->
	<div class="absolute -top-32 -right-32 w-64 h-64 bg-slate-400/10 rounded-full blur-3xl -z-10"></div>
	<div class="absolute -bottom-32 -left-32 w-64 h-64 bg-zinc-400/8 rounded-full blur-3xl -z-10"></div>

	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
					<BarChart3 class="h-4 w-4 text-slate-600 dark:text-slate-400" />
				</div>
				<div>
					<Card.Title class="text-base">Απόδοση Δικτύου</Card.Title>
					<Card.Description class="text-xs">
						Μέσος όρος % αλλαγής ανά τρίμηνο
					</Card.Description>
				</div>
			</div>
			
			{#if latestPeriod}
				<Badge variant="outline" class="text-xs font-normal">
					{latestPeriod.fullLabel}
				</Badge>
			{/if}
		</div>
	</Card.Header>

	<Card.Content class="flex-1 pt-4">
		{#if chartData.length > 0}
			<Chart.Container config={chartConfig} class="h-[180px] w-full px-0">
				<BarChart
					data={chartData}
					xScale={scaleBand().padding(0.8)}
					x="period"
					axis="x"
                    seriesLayout="group"
                    legend
					series={[
						{
							key: 'average',
							label: chartConfig.average.label,
							color: chartConfig.average.color
						}
					]}
					props={{
						xAxis: {
							format: (d: string) => d,
							tickLabelProps: {
								class: 'text-[10px] fill-muted-foreground'
							}
						},
						bars: {
							radius: 3,
							class: 'transition-opacity hover:opacity-80'
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip>
							{#snippet formatter({ value, name })}
								<span class="font-medium">{formatPercentage(value as number)}</span>
							{/snippet}
						</Chart.Tooltip>
					{/snippet}
				</BarChart>
			</Chart.Container>
		{:else}
			<div class="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
				Δεν υπάρχουν δεδομένα
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="pt-4 border-t border-border/40">
		<div class="flex items-center justify-between w-full text-sm">
			<div class="flex items-center gap-6">
				<div class="space-y-0.5">
					<p class="text-[10px] uppercase tracking-wider text-muted-foreground">Τρέχον</p>
					<p class="font-semibold">{formatPercentage(latestPeriod?.average ?? 0)}</p>
				</div>
				
				<div class="h-8 w-px bg-border/60"></div>
				
				<div class="space-y-0.5">
					<p class="text-[10px] uppercase tracking-wider text-muted-foreground">Μ.Ο. Περιόδων</p>
					<p class="font-medium text-muted-foreground">{formatPercentage(totalAverage)}</p>
				</div>
			</div>

			<!-- Trend indicator -->
			<div class="flex items-center gap-1.5">
				{#if overallTrend > 0}
					<TrendingUp class="h-3.5 w-3.5 text-emerald-400/80" />
					<span class="text-xs font-medium text-emerald-400/80">+{overallTrend}%</span>
				{:else if overallTrend < 0}
					<TrendingDown class="h-3.5 w-3.5 text-rose-600/70" />
					<span class="text-xs font-medium text-rose-600/70">{overallTrend}%</span>
				{:else}
					<Minus class="h-3.5 w-3.5 text-muted-foreground" />
					<span class="text-xs text-muted-foreground">Σταθερό</span>
				{/if}
			</div>
		</div>
	</Card.Footer>
</Card.Root>
<script lang="ts">
	import { Area, AreaChart, ChartClipPath } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import { scalePoint } from 'd3-scale';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { TrendingUp, TrendingDown } from 'lucide-svelte';
	import { cubicInOut } from 'svelte/easing';

	interface BonusData {
		id: number;
		period_id: number;
		org_id: number;
		current_kilos: number;
		previous_kilos: number;
		percentage_change: number;
		created_at: string;
		bonus_periods: {
			quarter: number;
			year: number;
		};
	}

	let { data = [] }: { data: BonusData[] } = $props();

	// Transform data for the chart - use quarter/year for x-axis
	const chartData = $derived(
		data
			.map((item) => ({
				// Create a label like "Q1 '26"
				period: `Q${item.bonus_periods.quarter} '${String(item.bonus_periods.year).slice(-2)}`,
				// For sorting: year * 10 + quarter (e.g., 20261, 20262, etc.)
				sortKey: item.bonus_periods.year * 10 + item.bonus_periods.quarter,
				percentage:
					typeof item.percentage_change === 'string'
						? parseFloat(item.percentage_change)
						: item.percentage_change
			}))
			.sort((a, b) => a.sortKey - b.sortKey)
	);

	// Get all period labels for the scale domain
	const periodLabels = $derived(chartData.map((d) => d.period));

	// Calculate average percentage change across all periods
	const averageChange = $derived(
		chartData.length > 0
			? chartData.reduce((sum, item) => sum + item.percentage, 0) / chartData.length
			: 0
	);

	// Determine trend direction: compare last value to first value
	// This reflects whether performance is IMPROVING or DECLINING over time
	const trendDirection = $derived(() => {
		if (chartData.length < 2) {
			// Only one data point - use its sign
			return chartData.length === 1 ? chartData[0].percentage >= 0 : true;
		}
		// Compare last period to first period
		const firstValue = chartData[0].percentage;
		const lastValue = chartData[chartData.length - 1].percentage;
		return lastValue >= firstValue;
	});

	const isPositive = $derived(trendDirection());

	const chartConfig = {
		percentage: {
			label: 'Ποσοστό %',
			// svelte-ignore state_referenced_locally
			color: isPositive ? 'var(--color-emerald-500)' : 'var(--color-red-500)'
		}
	} satisfies Chart.ChartConfig;
</script>

<div class="w-full space-y-2">
	<!-- Header with trend -->
	<div class="flex items-center justify-between">
		<span class="text-xs text-muted-foreground">Απόδοση</span>
		<div class="flex items-center gap-1 text-xs {isPositive ? 'text-emerald-600' : 'text-red-500'}">
			{#if isPositive}
				<TrendingUp class="size-3" />
			{:else}
				<TrendingDown class="size-3" />
			{/if}
			<span>{averageChange >= 0 ? '+' : ''}{averageChange.toFixed(1)}%</span>
		</div>
	</div>

	{#if chartData.length > 0}
		<div class="h-[100px] w-full">
			<Chart.Container config={chartConfig} class="h-full w-full">
				<AreaChart
					data={chartData}
					x="period"
					xScale={scalePoint().domain(periodLabels).padding(0.2)}
					padding={{ top: 10, bottom: 28, left: 4, right: 4 }}
					series={[
						{
							key: 'percentage',
							label: 'Ποσοστό',
							color: isPositive ? 'var(--color-emerald-500)' : 'var(--color-red-500)'
						}
					]}
					props={{
						area: {
							curve: curveNatural,
							'fill-opacity': 0.3,
							line: { class: 'stroke-2' },
							motion: 'tween'
						},
						xAxis: {
							format: (v) => v
						},
						yAxis: { format: () => '' }
					}}
				>
					{#snippet marks({ series, getAreaProps })}
						<defs>
							<linearGradient id="fillPercentage" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stop-color={isPositive ? 'var(--color-emerald-500)' : 'var(--color-red-500)'}
									stop-opacity={0.8}
								/>
								<stop
									offset="95%"
									stop-color={isPositive ? 'var(--color-emerald-500)' : 'var(--color-red-500)'}
									stop-opacity={0.1}
								/>
							</linearGradient>
						</defs>
						<ChartClipPath
							initialWidth={0}
							motion={{
								width: { type: 'tween', duration: 800, easing: cubicInOut }
							}}
						>
							{#each series as s, i (s.key)}
								<Area {...getAreaProps(s, i)} fill="url(#fillPercentage)" />
							{/each}
						</ChartClipPath>
					{/snippet}
					{#snippet tooltip()}
						<Chart.Tooltip labelFormatter={(v) => v} indicator="line" />
					{/snippet}
				</AreaChart>
			</Chart.Container>
		</div>
	{:else}
		<div class="flex h-[100px] items-center justify-center text-xs text-muted-foreground">
			Δεν υπάρχουν δεδομένα
		</div>
	{/if}
</div>
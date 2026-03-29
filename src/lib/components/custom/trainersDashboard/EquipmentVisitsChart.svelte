<script lang="ts">
	import { Area, AreaChart, ChartClipPath } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import { scalePoint } from 'd3-scale';
	import { cubicInOut } from 'svelte/easing';
	import { Wrench, TrendingUp, TrendingDown, Minus } from '@lucide/svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let {
		data = []
	}: {
		data: {
			month: string;
			visits: number;
			actions: number;
		}[];
	} = $props();

	const chartConfig = {
		visits: {
			label: 'Επισκέψεις',
			color: 'var(--chart-1)'
		},
		actions: {
			label: 'Ενέργειες',
			color: 'var(--chart-2)'
		}
	} satisfies Chart.ChartConfig;

	let months = $derived(data.map((d) => d.month));
	let totalVisits = $derived(data.reduce((s, d) => s + d.visits, 0));
	let totalActions = $derived(data.reduce((s, d) => s + d.actions, 0));

	let trend = $derived.by(() => {
		if (data.length < 2) return 0;
		return data[data.length - 1].visits - data[data.length - 2].visits;
	});
</script>

<Card.Root
	class="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm"
>
	<div
		class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
	></div>

	<Card.Header class="px-0 pt-0 pb-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="rounded-md bg-accent p-2">
					<Wrench class="h-4 w-4 text-muted-foreground" />
				</div>
				<div>
					<Card.Title class="font-tailormade text-base">Επισκέψεις Εξοπλισμού</Card.Title>
					<Card.Description class="text-xs">Επισκέψεις ανά μήνα</Card.Description>
				</div>
			</div>

			<div
				class="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold
				{trend > 0
					? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
					: trend < 0
						? 'bg-destructive/10 text-destructive'
						: 'bg-muted text-muted-foreground'}"
			>
				{#if trend > 0}
					<TrendingUp class="h-3 w-3" />&nbsp;+{trend}
				{:else if trend < 0}
					<TrendingDown class="h-3 w-3" />&nbsp;{trend}
				{:else}
					<Minus class="h-3 w-3" />&nbsp;Σταθερό
				{/if}
			</div>
		</div>
	</Card.Header>

	<Card.Content class="flex-1 px-0 pt-4">
		{#if data.length > 0}
			<Chart.Container config={chartConfig} class="h-[180px] w-full">
				<AreaChart
					{data}
					x="month"
					xScale={scalePoint().domain(months).padding(0.2)}
					padding={{ top: 10, bottom: 28, left: 4, right: 4 }}
					series={[
						{
							key: 'visits',
							label: chartConfig.visits.label,
							color: chartConfig.visits.color
						},
						{
							key: 'actions',
							label: chartConfig.actions.label,
							color: chartConfig.actions.color
						}
					]}
					props={{
						area: {
							curve: curveNatural,
							'fill-opacity': 0.25,
							line: { class: 'stroke-2' },
							motion: 'tween'
						},
						xAxis: { format: (v: string) => v },
						yAxis: { format: () => '' }
					}}
				>
					{#snippet marks({ series, getAreaProps })}
						<defs>
							<linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stop-color="var(--chart-1)" stop-opacity={0.7} />
								<stop offset="95%" stop-color="var(--chart-1)" stop-opacity={0.05} />
							</linearGradient>
							<linearGradient id="fillActions" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stop-color="var(--chart-2)" stop-opacity={0.7} />
								<stop offset="95%" stop-color="var(--chart-2)" stop-opacity={0.05} />
							</linearGradient>
						</defs>
						<ChartClipPath
							initialWidth={0}
							motion={{ width: { type: 'tween', duration: 800, easing: cubicInOut } }}
						>
							{#each series as s, i (s.key)}
								<Area
									{...getAreaProps(s, i)}
									fill={i === 0 ? 'url(#fillVisits)' : 'url(#fillActions)'}
								/>
							{/each}
						</ChartClipPath>
					{/snippet}
					{#snippet tooltip()}
						<Chart.Tooltip labelFormatter={(v) => v} indicator="line" />
					{/snippet}
				</AreaChart>
			</Chart.Container>

			<div class="mt-2 flex items-center gap-4">
				{#each Object.entries(chartConfig) as [key, cfg]}
					<div class="flex items-center gap-1.5">
						<div class="h-2 w-2 rounded-full" style="background-color: {cfg.color}"></div>
						<span class="text-[11px] text-muted-foreground">{cfg.label}</span>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
				<div class="text-center">
					<Wrench class="mx-auto mb-2 h-8 w-8 opacity-40" />
					<p>Δεν υπάρχουν δεδομένα</p>
				</div>
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="border-t border-border px-0 pb-0 pt-4">
		<div class="flex w-full items-center gap-6 text-sm">
			<div class="space-y-0.5">
				<p class="text-[10px] uppercase tracking-wider text-muted-foreground">Επισκέψεις</p>
				<p class="font-game font-semibold tabular-nums">{totalVisits}</p>
			</div>
			<div class="h-8 w-px bg-border/60"></div>
			<div class="space-y-0.5">
				<p class="text-[10px] uppercase tracking-wider text-muted-foreground">Ενέργειες</p>
				<p class="font-game font-medium tabular-nums text-muted-foreground">{totalActions}</p>
			</div>
			<div class="ml-auto hidden h-8 w-px bg-border/60 sm:block"></div>
			<div class="hidden space-y-0.5 sm:block">
				<p class="text-[10px] uppercase tracking-wider text-muted-foreground">Μ.Ο./Επίσκεψη</p>
				<p class="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
					{totalVisits > 0 ? (totalActions / totalVisits).toFixed(1) : 0}
				</p>
			</div>
		</div>
	</Card.Footer>
</Card.Root>

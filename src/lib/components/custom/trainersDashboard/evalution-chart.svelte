<script lang="ts">
	import { Area, AreaChart, ChartClipPath } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import { scalePoint } from 'd3-scale';
	import { cubicInOut } from 'svelte/easing';
	import { ClipboardCheck, TrendingUp, TrendingDown, Minus } from 'lucide-svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let {
		data = []
	}: {
		data: {
			month: string;    // e.g. "Ιαν", "Φεβ"
			submitted: number;
			reviewed: number;
		}[];
	} = $props();

	const chartConfig = {
		submitted: {
			label: 'Υποβληθείσες',
			color: 'var(--chart-1)'
		},
		reviewed: {
			label: 'Αξιολογημένες',
			color: 'var(--chart-2)'
		}
	} satisfies Chart.ChartConfig;

	let months = $derived(data.map((d) => d.month));
	let totalSubmitted = $derived(data.reduce((s, d) => s + d.submitted, 0));
	let totalReviewed = $derived(data.reduce((s, d) => s + d.reviewed, 0));

	let trend = $derived.by(() => {
		if (data.length < 2) return 0;
		return data[data.length - 1].submitted - data[data.length - 2].submitted;
	});
</script>

<Card.Root
	class="relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm h-full"
>
	<!-- Subtle top accent line -->
	<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

	<Card.Header class="px-0 pt-0 pb-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="rounded-md bg-accent p-2">
					<ClipboardCheck class="h-4 w-4 text-muted-foreground" />
				</div>
				<div>
					<Card.Title class="text-base font-tailormade">Αξιολογήσεις</Card.Title>
					<Card.Description class="text-xs">Υποβολές ανά μήνα</Card.Description>
				</div>
			</div>

			<div class="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold
				{trend > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
				 trend < 0 ? 'bg-destructive/10 text-destructive' :
				 'bg-muted text-muted-foreground'}">
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
					data={data}
					x="month"
					xScale={scalePoint().domain(months).padding(0.2)}
					padding={{ top: 10, bottom: 28, left: 4, right: 4 }}
					series={[
						{ key: 'submitted', label: chartConfig.submitted.label, color: chartConfig.submitted.color },
						{ key: 'reviewed', label: chartConfig.reviewed.label, color: chartConfig.reviewed.color }
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
							<linearGradient id="fillSubmitted" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stop-color="var(--chart-1)" stop-opacity={0.7} />
								<stop offset="95%" stop-color="var(--chart-1)" stop-opacity={0.05} />
							</linearGradient>
							<linearGradient id="fillReviewed" x1="0" y1="0" x2="0" y2="1">
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
									fill={i === 0 ? 'url(#fillSubmitted)' : 'url(#fillReviewed)'}
								/>
							{/each}
						</ChartClipPath>
					{/snippet}
					{#snippet tooltip()}
						<Chart.Tooltip labelFormatter={(v) => v} indicator="line" />
					{/snippet}
				</AreaChart>
			</Chart.Container>

			<!-- Legend -->
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
					<ClipboardCheck class="mx-auto mb-2 h-8 w-8 opacity-40" />
					<p>Δεν υπάρχουν δεδομένα</p>
				</div>
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="border-t border-border pb-0 px-0 pt-4">
		<div class="flex w-full items-center gap-6 text-sm">
			<div class="space-y-0.5">
				<p class="text-[10px] uppercase tracking-wider text-muted-foreground">Υποβληθείσες</p>
				<p class="font-game font-semibold tabular-nums">{totalSubmitted}</p>
			</div>
			<div class="h-8 w-px bg-border/60"></div>
			<div class="space-y-0.5">
				<p class="text-[10px] uppercase tracking-wider text-muted-foreground">Αξιολογημένες</p>
				<p class="font-game font-medium tabular-nums text-muted-foreground">{totalReviewed}</p>
			</div>
			<div class="ml-auto hidden sm:block h-8 w-px bg-border/60"></div>
			<div class="hidden sm:block space-y-0.5">
				<p class="text-[10px] uppercase tracking-wider text-muted-foreground">Ποσοστό</p>
				<p class="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
					{totalSubmitted > 0 ? Math.round((totalReviewed / totalSubmitted) * 100) : 0}%
				</p>
			</div>
		</div>
	</Card.Footer>
</Card.Root>
<script lang="ts">
	import { Area, AreaChart, ChartClipPath } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import { scalePoint } from 'd3-scale';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte';
	import { cubicInOut } from 'svelte/easing';
	import type { Component } from 'svelte';
	import { ArrowRight } from '@lucide/svelte';

	interface Props {
		title: string;
		description?: string;
		icon: Component<any>;
		reads: { read_at: string }[];
		color?: string;
		moreHref?: string;
	}

	let {
		title,
		description = 'Αναγνώσεις τελευταίων 7 ημερών',
		icon: Icon,
		reads,
		color = 'var(--chart-1)',
		moreHref
	}: Props = $props();

	const DAY_LABELS = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];

	const chartData = $derived.by(() => {
		const buckets: { key: string; label: string; count: number }[] = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = 6; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			buckets.push({ key, label: DAY_LABELS[d.getDay()], count: 0 });
		}

		const byKey = new Map(buckets.map((b) => [b.key, b]));

		for (const r of reads ?? []) {
			const parsed = new Date(r.read_at);
			if (isNaN(parsed.getTime())) continue;
			const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
			const bucket = byKey.get(key);
			if (bucket) bucket.count += 1;
		}

		return buckets;
	});

	const total = $derived(chartData.reduce((sum, d) => sum + d.count, 0));

	const trend = $derived.by(() => {
		if (chartData.length < 2) return 0;
		const firstHalf = chartData.slice(0, 3).reduce((s, d) => s + d.count, 0);
		const lastHalf = chartData.slice(4).reduce((s, d) => s + d.count, 0);
		if (firstHalf === 0) return lastHalf > 0 ? 100 : 0;
		return Number((((lastHalf - firstHalf) / firstHalf) * 100).toFixed(1));
	});

	const chartConfig = {
		count: {
			label: 'Αναγνώσεις',
			// svelte-ignore state_referenced_locally
			color
		}
	} satisfies Chart.ChartConfig;
	const periodLabels = $derived(chartData.map((d) => d.label));
	const gradientId = `readsFill-${Math.random().toString(36).slice(2, 9)}`;
</script>

<Card.Root
	class="relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm"
>
	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="rounded-lg bg-slate-100 p-2 dark:bg-slate-800/50">
					<Icon class="h-4 w-4 text-slate-600 dark:text-slate-400" />
				</div>
				<div>
					<Card.Title class="text-base">{title}</Card.Title>
					<Card.Description class="text-xs">{description}</Card.Description>
				</div>
			</div>
			<Badge variant="outline" class="text-xs font-normal">{total}</Badge>
		</div>
	</Card.Header>

	<Card.Content class="flex-1 pt-4">
		{#if total > 0}
			<div class="h-[140px] w-full">
				<Chart.Container config={chartConfig} class="h-full w-full">
					<AreaChart
						data={chartData}
						x="label"
						xScale={scalePoint().domain(periodLabels).padding(0.2)}
						padding={{ top: 10, bottom: 24, left: 4, right: 4 }}
						series={[{ key: 'count', label: 'Αναγνώσεις', color }]}
						props={{
							area: {
								curve: curveNatural,
								'fill-opacity': 0.3,
								line: { class: 'stroke-2' },
								motion: 'tween'
							},
							xAxis: {
								format: (v) => v,
								tickLabelProps: { class: 'text-[10px] fill-muted-foreground' }
							},
							yAxis: { format: () => '' }
						}}
					>
						{#snippet marks({ series, getAreaProps })}
							<defs>
								<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stop-color={color} stop-opacity={0.8} />
									<stop offset="95%" stop-color={color} stop-opacity={0.1} />
								</linearGradient>
							</defs>
							<ChartClipPath
								initialWidth={0}
								motion={{ width: { type: 'tween', duration: 800, easing: cubicInOut } }}
							>
								{#each series as s, i (s.key)}
									<Area {...getAreaProps(s, i)} fill="url(#{gradientId})" />
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
			<div class="flex h-[140px] items-center justify-center text-sm text-muted-foreground">
				Δεν υπάρχουν δεδομένα
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="border-t border-border/40 pt-4">
		<div class="flex w-full items-center justify-between text-sm">
			<div class="space-y-0.5">
				<p class="text-[10px] tracking-wider text-muted-foreground uppercase">Σύνολο</p>
				<p class="font-semibold">{total}</p>
			</div>
			<div class="flex items-center gap-1.5">
				{#if trend > 0}
					<TrendingUp class="h-3.5 w-3.5 text-emerald-400/80" />
					<span class="text-xs font-medium text-emerald-400/80">+{trend}%</span>
				{:else if trend < 0}
					<TrendingDown class="h-3.5 w-3.5 text-rose-600/70" />
					<span class="text-xs font-medium text-rose-600/70">{trend}%</span>
				{:else}
					<Minus class="h-3.5 w-3.5 text-muted-foreground" />
					<span class="text-xs text-muted-foreground">Σταθερό</span>
				{/if}
			</div>
			{#if moreHref}
				<a
					href={moreHref}
					class="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					Περισσότερα
					<ArrowRight
						class="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5"
					/>
				</a>
			{/if}
		</div>
	</Card.Footer>
</Card.Root>

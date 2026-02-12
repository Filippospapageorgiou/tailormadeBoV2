<script lang="ts">
	import { scaleBand } from 'd3-scale';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { BarChart } from 'layerchart';
	import { Receipt } from 'lucide-svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	interface propsData {
		data: {
			org_id: number;
			store_name: string;
			total_sales: number;
		}[] | null | undefined;
	}

	let { data }: propsData = $props();

	// Format currency
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('el-GR', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(value);
	}

	// Today formatted
	function formatToday(): string {
		return new Intl.DateTimeFormat('el-GR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		}).format(new Date());
	}

	// Chart config
	const chartConfig = {
		total_sales: {
			label: 'Πωλήσεις',
			color: 'var(--chart-2)'
		}
	} satisfies Chart.ChartConfig;

	// Total sales across all orgs
	let totalSales = $derived(
		(data ?? []).reduce((sum, d) => sum + (d.total_sales ?? 0), 0)
	);

	// Best performing store
	let topStore = $derived.by(() => {
		if (!data || data.length === 0) return null;
		return data.reduce((best, d) => (d.total_sales > best.total_sales ? d : best), data[0]);
	});
</script>

<Card.Root class="relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm">
	<!-- Subtle gradient background -->
	<div class="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"></div>
	<div class="absolute -top-32 -right-32 -z-10 h-64 w-64 rounded-full bg-blue-400/8 blur-3xl"></div>

	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="rounded-lg bg-blue-100 p-2 dark:bg-blue-800/50">
					<Receipt class="h-4 w-4 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<Card.Title class="text-base">Πωλήσεις Ημέρας</Card.Title>
					<Card.Description class="text-xs">
						{formatToday()}
					</Card.Description>
				</div>
			</div>

			<Badge variant="outline" class="text-xs font-normal">
				Σύνολο: {formatCurrency(totalSales)}
			</Badge>
		</div>
	</Card.Header>

	<Card.Content class="flex-1 pt-4">
		{#if data && data.length > 0}
			<Chart.Container config={chartConfig} class="h-[250px] w-full">
				<BarChart
					data={data}
					x="store_name"
					xScale={scaleBand().padding(0.9)}
					axis="x"
					seriesLayout="group"
					series={[
						{
							key: 'total_sales',
							label: chartConfig.total_sales.label,
							color: chartConfig.total_sales.color
						}
					]}
					props={{
						bars: {
							radius: 4,
							class: 'transition-opacity hover:opacity-80'
						},
						xAxis: {
							format: (d: string) => d,
							tickLabelProps: {
								class: 'text-[10px] fill-muted-foreground'
							}
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip>
							{#snippet formatter({ value })}
								<span class="font-medium">{formatCurrency(value as number)}</span>
							{/snippet}
						</Chart.Tooltip>
					{/snippet}
				</BarChart>
			</Chart.Container>
		{:else}
			<div class="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
				<div class="text-center">
					<Receipt class="mx-auto mb-2 h-8 w-8 opacity-50" />
					<p>Δεν υπάρχουν δεδομένα πωλήσεων</p>
				</div>
			</div>
		{/if}
	</Card.Content>

	{#if topStore}
		<Card.Footer class="border-t border-border/40 pt-4">
			<div class="flex w-full items-center justify-between text-sm">
				<div class="flex items-center gap-6">
					<div class="space-y-0.5">
						<p class="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Κορυφαίο</p>
						<p class="font-semibold">{topStore.store_name}</p>
					</div>
					<div class="h-8 w-px bg-border/60"></div>
					<div class="space-y-0.5">
						<p class="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Πωλήσεις</p>
						<p class="font-medium text-emerald-600">{formatCurrency(topStore.total_sales)}</p>
					</div>
				</div>
				<div class="space-y-0.5 text-right">
					<p class="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Καταστήματα</p>
					<p class="font-medium">{data?.length ?? 0}</p>
				</div>
			</div>
		</Card.Footer>
	{/if}
</Card.Root>
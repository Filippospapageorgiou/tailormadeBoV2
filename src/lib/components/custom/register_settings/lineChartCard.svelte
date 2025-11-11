<script lang="ts">
	import { TrendingUp, TrendingDown, DollarSign, Minus } from 'lucide-svelte';
	import { curveNatural } from 'd3-shape';
	import { scaleUtc } from 'd3-scale';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { LineChart } from 'layerchart';

    let { registerData, percentageChange,selectedPeriodLabel } = $props();
    // Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('el-GR', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 2
		}).format(amount);
	}

	// Format date range
	function formatDateRange(start: string, end: string): string {
		const startDate = new Date(start);
		const endDate = new Date(end);
		const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		return `${startDate.toLocaleDateString('el-GR', options)} - ${endDate.toLocaleDateString('el-GR', options)}`;
	}

	// Chart configuration
	const chartConfig = {
		sales: {
			label: 'Πώλησεις  ',
			color: '#8B6B4A'
		}
	} satisfies Chart.ChartConfig;

	let chartData = $derived.by(() => {
		if (!registerData?.currentPeriod) return [];

		const data = registerData.currentPeriod.map((closing: { closing_date: string; total_sales?: number | null }) => {
			const salesValue = Number(((closing.total_sales ?? 0)).toFixed(1));
			return {
				date: new Date(closing.closing_date),
				sales: salesValue
			};
		});

		// Filter out dates with no sales data (only show dates that have actual sales)
		return data.filter((item: any) => item.sales > 0);
	});

	// Calculate metrics for card
	let totalSales = $derived.by(() => {
		if (!registerData?.currentPeriod) return 0;
		return registerData.currentPeriod.reduce((sum: any, closing: { total_sales: any; }) => sum + (closing.total_sales || 0), 0);
	});

	let averageSales = $derived.by(() => {
		if (!registerData?.currentPeriod || registerData.currentPeriod.length === 0) return 0;
		return totalSales / registerData.currentPeriod.length;
	});

	let highestSales = $derived.by(() => {
		if (!registerData?.currentPeriod) return 0;
		return Math.max(...registerData.currentPeriod.map((c: { total_sales: any; }) => c.total_sales || 0));
	});

	let lowestSales = $derived.by(() => {
		if (!registerData?.currentPeriod) return 0;
		return Math.min(...registerData.currentPeriod.map((c: { total_sales: any; }) => c.total_sales || 0));
	});
</script>

<!-- Chart Card -->
<div>
	<Card.Root class="bg-white">
		<Card.Header>
			<Card.Title>Απόδοση πωλήσεων</Card.Title>
			<Card.Description>
				{selectedPeriodLabel} • {registerData?.currentPeriod?.length || 0} ημέρες παρακολούθησης
				<p class="py-2 text-sm text-neutral-600">
					{formatDateRange(
						registerData?.currentStartDate!,
						registerData?.currentEndDate!
					)}
				</p>
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<Chart.Container config={chartConfig} class="h-[200px] w-full">
				<LineChart
					points={{ r: 4 }}
					data={chartData}
					x="date"
					xScale={scaleUtc()}
					axis="x"
					series={[
						{
							key: 'sales',
							label: 'Total Sales',
							color: chartConfig.sales.color
						}
					]}
					props={{
						spline: { curve: curveNatural, motion: 'tween', strokeWidth: 2 },
						highlight: {
							points: {
								motion: 'none',
								r: 6
							}
						},
						xAxis: {
							format: (v: Date) =>
								v.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
							ticks: chartData.length
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip
							labelKey="date"
							nameKey="sales"
							indicator="dot"
							labelFormatter={(value) => {
								if (value instanceof Date) {
									return value.toLocaleDateString('en-US', {
										weekday: 'short',
										month: 'short',
										day: 'numeric',
										year: 'numeric'
									});
								}
								return String(value);
							}}
						/>
					{/snippet}
				</LineChart>
			</Chart.Container>
		</Card.Content>
		<Card.Footer class="flex flex-col bg-white pt-6 pb-6">
			<div
				class="flex flex-col gap-4 px-1 font-mono sm:flex-row sm:items-center sm:justify-between"
			>
				<!-- Left: Key Metrics (compact) -->
				<div class="grid grid-cols-2 gap-4 sm:flex sm:items-baseline sm:gap-8">
					<div class="space-y-0.5">
						<p class="text-xs font-medium text-neutral-400">Συνολίκες Πωλήσεις</p>
						<p class="text-base font-semibold text-neutral-900 sm:text-lg">
							{formatCurrency(totalSales)}
						</p>
					</div>

					<div class="space-y-0.5">
						<p class="text-xs font-medium text-neutral-400">Μέσο όρο Ημέρας</p>
						<p class="text-base font-semibold text-neutral-900 sm:text-lg">
							{formatCurrency(averageSales)}
						</p>
					</div>

					<div class="space-y-0.5">
						<p class="text-xs font-medium text-neutral-400">Μέγιστο</p>
						<p class="text-base font-semibold text-neutral-900 sm:text-lg">
							{formatCurrency(highestSales)}
						</p>
					</div>

					<div class="space-y-0.5">
						<p class="text-xs font-medium text-neutral-400">Χαμηλότερο</p>
						<p class="text-base font-semibold text-neutral-900 sm:text-lg">
							{formatCurrency(lowestSales)}
						</p>
					</div>
				</div>

				<!-- Divider -->
				<div class="hidden h-6 w-px bg-neutral-400 sm:block"></div>

				<!-- Right: Trend Badge (minimal) -->
				<div class="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-2">
					<span class="text-neutral-400">Period:</span>
					<div
						class={`flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 ${
							percentageChange! > 0
								? 'bg-neutral-50 text-neutral-700'
								: percentageChange! < 0
									? 'bg-neutral-50 text-neutral-700'
									: 'bg-neutral-50 text-neutral-700'
						}`}
					>
						{#if percentageChange! > 0}
							<TrendingUp class="h-5 w-5 text-green-600" />
							<span class="text-sm font-semibold text-green-600">
								+{percentageChange!}%
							</span>
						{:else if percentageChange! < 0}
							<TrendingDown class="h-5 w-5 text-red-600" />
							<span class="text-sm font-semibold text-red-600">
								{percentageChange!}%
							</span>
						{:else}
							<Minus class="h-5 w-5 text-neutral-500" />
							<span class="text-sm font-semibold text-neutral-500">No change</span>
						{/if}
					</div>
					<p class="text-xs font-medium tracking-wide text-neutral-400 uppercase">Comparing to</p>
					<p class="text-sm text-neutral-600">
						{formatDateRange(
							registerData?.previousStartDate!,
							registerData?.previousEndDate!
						)}
					</p>
				</div>
			</div>
		</Card.Footer>
	</Card.Root>
</div>
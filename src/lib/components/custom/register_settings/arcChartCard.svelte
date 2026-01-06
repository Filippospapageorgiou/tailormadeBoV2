<script lang="ts">
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Arc, PieChart, Text, ArcChart } from 'layerchart';
	import CustomButton from './customButton/customButton.svelte';

	let { expensesData, selectedDays } = $props();

	// Format currency for display
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('el-GR', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 2
		}).format(amount);
	}

	// Format date range
	function formatDateRange(start: string, end: string): string {
		if (!start || !end) return '';
		const startDate = new Date(start);
		const endDate = new Date(end);
		const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		return `${startDate.toLocaleDateString('el-GR', options)} - ${endDate.toLocaleDateString('el-GR', options)}`;
	}

	// Arc chart data - needs to be structured for layerchart
	const chartDataArc = $derived.by(() => {
		const value = expensesData?.totalExpenses ?? 0;
		return [
			{
				key: 'expenses',
				name: 'Συνολικά Έξοδα',
				value: value,
				fill: 'var(--chart-1)'
			}
		];
	});

	// Define a reasonable max value (e.g., budget or target)
	// You might want to pass this as a prop or calculate based on historical data
	const maxExpenses = $derived.by(() => {
		const currentValue = expensesData?.totalExpenses ?? 0;
		// If you have a budget, use that. Otherwise, use a multiplier for visual context
		return expensesData?.budget ?? currentValue * 1.5;
	});

	const chartConfigArc = {
		expenses: {
			label: 'Συνολικά Έξοδα',
			color: 'var(--chart-1)'
		}
	} satisfies Chart.ChartConfig;
</script>

<Card.Root class="relative flex h-full flex-col glass-card rounded-2xl p-6 overflow-hidden backdrop-blur-xl">
	<!-- Glassy gradient background -->
	<div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-card/80 to-secondary/30 -z-10"></div>
	
	<!-- Ambient glow effect -->
	<div class="absolute -top-20 -left-16 w-40 h-40 bg-chart-1/25 rounded-full blur-3xl -z-10"></div>
	<div class="absolute -bottom-24 -right-20 w-44 h-44 bg-primary/20 rounded-full blur-3xl -z-10"></div>

	<Card.Header class="items-center">
		<Card.Title>Συνολικά Έξοδα</Card.Title>
		<Card.Description>
			<div class="flex items-center justify-between gap-2">
				Εμφάνιση συνολικών εξόδων για τις τελευταίες ημερομηνίες
				<CustomButton href="/app/settings/register_settings/expenses" />
			</div>
		</Card.Description>
	</Card.Header>

	<Card.Content class="flex-1 flex items-center justify-center">
		<Chart.Container config={chartConfigArc} class="mx-auto aspect-square max-h-[250px] w-full">
			<ArcChart
				value={chartDataArc[0].value}
				maxValue={maxExpenses}
				outerRadius={100}
				innerRadius={75}
				trackOuterRadius={95}
				trackInnerRadius={80}
				padding={20}
				range={[180, -90]}
				series={[
					{
						key: 'expenses',
						color: 'var(--chart-1)',
						data: chartDataArc
					}
				]}
				props={{
					arc: {
						track: { class: 'fill-muted/50' },
						motion: 'tween'
					}
				}}
				tooltip={false}
			>
				{#snippet belowMarks()}
					<circle cx="0" cy="0" r="70" class="fill-card/80" />
				{/snippet}

				{#snippet aboveMarks()}
					<Text
						value={formatCurrency(chartDataArc[0].value)}
						textAnchor="middle"
						verticalAnchor="middle"
						class="fill-foreground text-2xl! font-bold"
						dy={-5}
					/>
					<Text
						value="Συνολικά Έξοδα"
						textAnchor="middle"
						verticalAnchor="middle"
						class="fill-muted-foreground text-xs!"
						dy={18}
					/>
				{/snippet}
			</ArcChart>
		</Chart.Container>
	</Card.Content>

	<Card.Footer class="flex-col gap-2 text-sm">
		<div class="flex items-center gap-2 leading-none text-muted-foreground">
			{formatDateRange(expensesData?.currentStartDate, expensesData?.currentEndDate)}
		</div>
	</Card.Footer>
</Card.Root>
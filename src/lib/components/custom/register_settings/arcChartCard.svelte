<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Text, ArcChart } from 'layerchart';
	import CustomButton from './customButton/customButton.svelte';

	let { expensesData, selectedDays } = $props();

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('el-GR', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 2
		}).format(amount);
	}

	function formatDateRange(start: string, end: string): string {
		if (!start || !end) return '';
		const startDate = new Date(start);
		const endDate = new Date(end);
		const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		return `${startDate.toLocaleDateString('el-GR', options)} - ${endDate.toLocaleDateString('el-GR', options)}`;
	}

	const EXPENSE_LIMIT = 1000;

	const totalExpenses = $derived(expensesData?.totalExpenses ?? 0);

	const chartData = $derived([
		{
			key: 'expenses',
			label: 'Συνολικά Έξοδα',
			value: totalExpenses,
			color: 'var(--color-expenses)'
		}
	]);

	const chartConfig = {
		expenses: {
			label: 'Συνολικά Έξοδα',
			color: 'var(--chart-1)'
		}
	} satisfies Chart.ChartConfig;
</script>

<Card.Root class="relative flex h-full flex-col glass-card rounded-2xl p-6 overflow-hidden backdrop-blur-xl">
	<!-- Glassy gradient background -->
	<div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-card/80 to-secondary/30 -z-10"></div>
	
	<!-- Ambient glow effects -->
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
		<Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-[250px] w-full">
			<ArcChart
				label="label"
				value="value"
				outerRadius={86}
				innerRadius={76}
				trackOuterRadius={84}
				trackInnerRadius={78}
				padding={40}
				range={[90, -270]}
				maxValue={EXPENSE_LIMIT}
				series={chartData.map((d) => ({
					key: d.key,
					color: d.color,
					data: [d]
				}))}
				props={{
					arc: { track: { fill: 'var(--muted)' }, motion: 'tween' },
					tooltip: { context: { hideDelay: 350 } }
				}}
				tooltip={false}
			>
				{#snippet belowMarks()}
					<circle cx="0" cy="0" r="72" class="fill-card/80" />
				{/snippet}

				{#snippet aboveMarks()}
					<Text
						value={formatCurrency(totalExpenses)}
						textAnchor="middle"
						verticalAnchor="middle"
						class="fill-foreground text-2xl! font-bold"
						dy={-2}
					/>
					<Text
						value={`Εξόδα Καταστήματος`}
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
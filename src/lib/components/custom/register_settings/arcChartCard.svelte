<script lang="ts">
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Arc, PieChart, Text, ArcChart } from 'layerchart';
	import LineChartCard from '$lib/components/custom/register_settings/lineChartCard.svelte';
	import PieChartCard from '$lib/components/custom/register_settings/pieChartCard.svelte';

    let { expensesData, selectedDays } = $props();

	const chartDataArc = $derived.by(() => {
		if (!expensesData)
			return [
				{
					name: '',
					value: 0,
					fill: 'var(--chart-1)'
				}
			];

		return [
			{
				name: 'Total Expenses',
				value: expensesData?.totalExpenses,
				fill: 'var(--chart-1)'
			}
		];
	});

	const chartConfigArc = {
		value: { label: 'Συνολίκα Εξόδα' }
	} satisfies Chart.ChartConfig;
</script>

<Card.Root class="flex h-full flex-col bg-white">
	<Card.Header class="items-center">
		<Card.Title>Συνολίκα Εξοδα</Card.Title>
		<Card.Description
			>Εμφάνιση συνολικών εξόδων για τις τελευταίες {selectedDays} ημέρες</Card.Description
		>
	</Card.Header>
	<Card.Content class="flex-1">
		<Chart.Container config={chartConfigArc} class="mx-auto aspect-square max-h-[250px]">
			<ArcChart
				label="expenses"
				value="Συνολίκα Έξοδα"
				outerRadius={88}
				innerRadius={66}
				trackOuterRadius={83}
				trackInnerRadius={72}
				padding={40}
				range={[90, -270]}
				maxValue={chartDataArc[0].value * 4}
				series={chartDataArc.map((d) => ({
					key: d.name,
					color: d.fill,
					data: [d]
				}))}
				props={{
					arc: { track: { fill: 'var(--muted)' }, motion: 'tween' },
					tooltip: { context: { hideDelay: 350 } }
				}}
				tooltip={false}
			>
				{#snippet belowMarks()}
					<circle cx="0" cy="0" r="80" class="fill-background" />
				{/snippet}
				{#snippet aboveMarks()}
					<Text
						value={String(chartDataArc[0].value)}
						textAnchor="middle"
						verticalAnchor="middle"
						class="fill-foreground text-4xl! font-bold"
						dy={3}
					/>
					<Text
						value="Συνολίκα 'Εξοδα"
						textAnchor="middle"
						verticalAnchor="middle"
						class="fill-muted-foreground!"
						dy={22}
					/>
				{/snippet}
			</ArcChart>
		</Chart.Container>
	</Card.Content>
	<Card.Footer class="flex-col gap-2 text-sm">
		<div class="flex items-center gap-2 leading-none text-muted-foreground">
			{expensesData?.currentStartDate} - {expensesData?.currentEndDate}
		</div>
	</Card.Footer>
</Card.Root>

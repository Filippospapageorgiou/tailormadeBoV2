<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Arc, PieChart, Text } from 'layerchart';

	let { supplierData, currentStartDate, currentEndDate, totalSupplierPayments, countSuppliers } =
		$props();

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

	// Define color palette for suppliers
	const supplierColors = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)',
		'var(--chart-6)',
		'var(--chart-7)',
		'var(--chart-8)',
		'var(--chart-9)',
		'var(--chart-10)'
	];

	// Transform supplier data for chart
	let supplierChartData = $derived.by(() => {
		if (!Array.isArray(supplierData)) return [];

		return supplierData.map((supplier, index) => ({
			supplier: supplier.supplier_name,
			total: parseFloat(supplier.total.toFixed(2)),
			color: supplierColors[index % supplierColors.length]
		}));
	});

	// Create chart config dynamically from suppliers
	let supplierChartConfig = $derived.by(() => {
		const config: Chart.ChartConfig = {
			total: { label: 'Total Payments' }
		};

		if (!Array.isArray(supplierData)) return config;

		supplierData.forEach((supplier, index) => {
			config[supplier.supplier_name] = {
				label: supplier.supplier_name.charAt(0).toUpperCase() + supplier.supplier_name.slice(1),
				color: supplierColors[index % supplierColors.length]
			};
		});

		return config;
	}) satisfies Chart.ChartConfig;
</script>

<Card.Root class="flex h-full flex-col bg-white">
	<Card.Header class="items-center">
		<Card.Title>Διανομή πληρωμών προμηθευτών</Card.Title>
		<Card.Description>
			Ανάλυση πληρωμών ανά προμηθευτή μέτρητα - εμφάνιση των κορυφαίων 10
			<p class="py-2 text-sm text-neutral-600">
				{formatDateRange(currentStartDate!, currentEndDate!)}
			</p>
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<Chart.Container config={supplierChartConfig} class="mx-auto aspect-square max-w-[250px]">
			<PieChart
				data={supplierChartData}
				key="supplier"
				value="total"
				cRange={supplierChartData.map((d) => d.color)}
				c="color"
				props={{
					pie: {
						motion: 'tween'
					}
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip hideLabel labelFormatter={(value) => formatCurrency(value)} />
				{/snippet}
				{#snippet arc({ props, visibleData, index })}
					{@const supplier = visibleData?.[index]?.supplier}
					{#if supplier}
						<Arc {...props}>
							{#snippet children({ getArcTextProps })}
								<Text
									value={supplier.slice(0, 2).toUpperCase()}
									{...getArcTextProps('centroid')}
									class="fill-white text-xs font-semibold capitalize"
								/>
							{/snippet}
						</Arc>
					{/if}
				{/snippet}
			</PieChart>
		</Chart.Container>
	</Card.Content>
	<Card.Footer class="flex-col gap-2 text-sm">
		<div class="flex items-center gap-2 leading-none font-medium">
			Συνολικές πληρωμές: {formatCurrency(totalSupplierPayments! || 0)}
		</div>
		<div class="py-2 leading-none text-muted-foreground">
			{countSuppliers} - προμηθευτές
		</div>
	</Card.Footer>
</Card.Root>

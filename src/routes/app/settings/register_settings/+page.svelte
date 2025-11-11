<script lang="ts">
	import {
		authenticatedAccess,
		getRegisterClosingByDateRange,
		getSuppliersDataPayments,
		getExpensesData,
		getRegisterDataTable
	} from './data.remote';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import * as Select from '$lib/components/ui/select';
	import LineChartCard from '$lib/components/custom/register_settings/lineChartCard.svelte';
	import PieChartCard from '$lib/components/custom/register_settings/pieChartCard.svelte';
	import ArcChartCard from '$lib/components/custom/register_settings/arcChartCard.svelte';
	import RegisterDataTable from './data-table.svelte';
	import { registerColumns } from './columns';

	let auth = authenticatedAccess();
	
	// State for time period selection
	let selectedDays = $state(30);

	let registerDataTableQuery = $derived.by(() => getRegisterDataTable({ days: selectedDays, start: 1, end: 10 }));

	// Fetch register data based on selected period
	let registerQuery = $derived.by(() => getRegisterClosingByDateRange({ days: selectedDays }));
	let suppliersPaymentsQuery = $derived.by(() => getSuppliersDataPayments({ days: selectedDays }));
	let expensesQuery = $derived.by(() => getExpensesData({ days: selectedDays }));
	let expensesData = $derived(expensesQuery?.current);

	let supplierData = $derived(suppliersPaymentsQuery.current?.supplierTotals);
	let totalSupplierPayments = $derived(suppliersPaymentsQuery?.current?.totalSupplierPayments)
	let countSuppliers = $derived(suppliersPaymentsQuery?.current?.countSuppliers)

	let currentStartDate = $derived(registerQuery.current?.currentStartDate)
	let currentEndDate = $derived(registerQuery.current?.currentEndDate)
	
	let registerData = $derived(registerQuery.current);
	let percentageChange = $derived(registerQuery?.current?.percentageChange);

	// Table data
	let tableData = $derived(registerDataTableQuery.current?.data ?? []);

	// Time period options
	const periodOptions = [
		{ value: '7', label: 'Last 7 Days' },
		{ value: '15', label: 'Last 15 Days' },
		{ value: '30', label: 'Last 30 Days' }
	];

	let selectedPeriodLabel = $derived(
		periodOptions.find((opt) => opt.value === String(selectedDays))?.label || 'Last 30 Days'
	);

	
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-background">
		<main class="container mx-auto space-y-6 px-4 py-6 md:px-6">
			<!-- Header -->
			<div class="space-y-2">
				<h1 class="font-mono text-3xl tracking-wider text-neutral-800 md:text-4xl">
					Εγγραφή Αναλυτικά στοιχεία
				</h1>
				<p class="text-sm text-muted-foreground">
					Επισκόπηση κλεισίματος ταμείου, εσόδων και εξόδων
				</p>
			</div>

			<!-- Time Period Selector -->
			<div class="flex items-center gap-4">
				<span class="text-sm font-medium text-muted-foreground">Time Period:</span>
				<Select.Root
					type="single"
					value={String(selectedDays)}
					onValueChange={(value) => {
						if (value) selectedDays = parseInt(value);
					}}
				>
					<Select.Trigger class="w-[180px]">
						{selectedPeriodLabel}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Select Period</Select.Label>
							{#each periodOptions as option}
								<Select.Item value={option.value} label={option.label}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Analytics Cards -->
			<LineChartCard 
				{registerData}
				{percentageChange}
				{selectedPeriodLabel}
			/>

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<PieChartCard
					{supplierData}
					{currentStartDate}
					{currentEndDate}
					{countSuppliers}
					{totalSupplierPayments}
				/>
				<ArcChartCard
					{expensesData}
					{selectedDays}
				/>
			</div>

			<!-- Register Data Table Section -->
			<div class="space-y-4">
				<div class="space-y-2">
					<h2 class="text-2xl font-semibold text-neutral-800">
						Register Closings
					</h2>
					<p class="text-sm text-muted-foreground">
						All register closing records for the selected period
					</p>
				</div>
				<RegisterDataTable data={tableData} columns={registerColumns} />
			</div>
		</main>
	</div>
{/if}
<script lang="ts">
	import {
		authenticatedAccess,
		getRegisterClosingByDateRange,
		getSuppliersDataPayments,
		getExpensesData,
		getRegisterDataTable
	} from './data.remote';
	import { type PaginationState } from '@tanstack/table-core';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import * as Select from '$lib/components/ui/select';
	import LineChartCard from '$lib/components/custom/register_settings/lineChartCard.svelte';
	import PieChartCard from '$lib/components/custom/register_settings/pieChartCard.svelte';
	import ArcChartCard from '$lib/components/custom/register_settings/arcChartCard.svelte';
	import RegisterDataTable from './data-table.svelte';
	import { registerColumns } from './columns';
	import RangeDatePicker from '$lib/components/custom/register_settings/rangeDatePicker.svelte';
	import { getLocalTimeZone, now } from '@internationalized/date';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { getDeleteAction, setDeleteAction } from './index.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { showFailToast } from '$lib/stores/toast.svelte';
	import { toast } from 'svelte-sonner';

	let dateFilterMode = $state<'period' | 'range'>('period');

	function calendarDateToString(calendarDate: any): string {
		if (!calendarDate) {
			return '';
		}

		// Handle @internationalized/date CalendarDate objects
		if (
			typeof calendarDate.year === 'number' &&
			typeof calendarDate.month === 'number' &&
			typeof calendarDate.day === 'number'
		) {
			const year = calendarDate.year;
			const month = String(calendarDate.month).padStart(2, '0');
			const day = String(calendarDate.day).padStart(2, '0');
			return `${year}-${month}-${day}`;
		}

		// Handle Date objects
		if (calendarDate instanceof Date) {
			const year = calendarDate.getFullYear();
			const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
			const day = String(calendarDate.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		}

		// If it's already a string, validate it
		if (typeof calendarDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) {
			return calendarDate;
		}

		return '';
	}

	let auth = authenticatedAccess();
	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});
	// State for time period selection
	let selectedDays = $state(30);
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });

	let daysDifference = $derived.by(() => {
		if (dateFilterMode === 'period') {
			return selectedDays;
		} else {
			const start = new Date(rangeStartString);
			const end = new Date(rangeEndString);
			const diffTime = Math.abs(end.getTime() - start.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays;
		}
	});

	// svelte-ignore state_referenced_locally
	let end = daysDifference;
	// svelte-ignore state_referenced_locally
	let start = pagination.pageIndex + 1;
	// Get today's date - use derived to ensure they're always valid
	let rangeStart = $state(now(getLocalTimeZone()).subtract({ days: 7 }));
	let rangeEnd = $state(now(getLocalTimeZone()));

	// Computed string versions for queries
	let rangeStartString = $derived(calendarDateToString(rangeStart));
	let rangeEndString = $derived(calendarDateToString(rangeEnd));

	// Then use in query:
	let registerDataTableQuery = $derived.by(() => {
		if (dateFilterMode === 'period') {
			return getRegisterDataTable({
				mode: 'period' as const,
				days: selectedDays,
				start,
				end
			});
		} else {
			return getRegisterDataTable({
				mode: 'range' as const,
				startDate: rangeStartString,
				endDate: rangeEndString,
				start,
				end
			});
		}
	});

	let registerQuery = $derived.by(() => {
		if (dateFilterMode === 'period') {
			return getRegisterClosingByDateRange({
				mode: 'period' as const,
				days: selectedDays,
				start,
				end
			});
		} else {
			return getRegisterClosingByDateRange({
				mode: 'range' as const,
				startDate: rangeStartString,
				endDate: rangeEndString,
				start,
				end
			});
		}
	});

	let suppliersPaymentsQuery = $derived.by(() => {
		if (dateFilterMode === 'period') {
			return getSuppliersDataPayments({
				mode: 'period' as const,
				days: selectedDays,
				start,
				end
			});
		} else {
			return getSuppliersDataPayments({
				mode: 'range' as const,
				startDate: rangeStartString,
				endDate: rangeEndString,
				start,
				end
			});
		}
	});

	let expensesQuery = $derived.by(() => {
		if (dateFilterMode === 'period') {
			return getExpensesData({
				mode: 'period' as const,
				days: selectedDays,
				start,
				end
			});
		} else {
			return getExpensesData({
				mode: 'range' as const,
				startDate: rangeStartString,
				endDate: rangeEndString,
				start,
				end
			});
		}
	});

	let expensesData = $derived(expensesQuery?.current);

	let supplierData = $derived(suppliersPaymentsQuery.current?.supplierTotals ?? []);
	let totalSupplierPayments = $derived(suppliersPaymentsQuery?.current?.totalSupplierPayments ?? 0);
	let countSuppliers = $derived(suppliersPaymentsQuery?.current?.countSuppliers ?? 0);

	let currentStartDate = $derived(registerQuery.current?.currentStartDate);
	let currentEndDate = $derived(registerQuery.current?.currentEndDate);

	let registerData = $derived(registerQuery.current);
	let percentageChange = $derived(registerQuery?.current?.percentageChange!);

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

	$effect(() => {
		if (getDeleteAction()) {
			refresh();
		}
	});
	async function refresh() {
		await registerDataTableQuery.refresh();
		await registerQuery.refresh();
		await suppliersPaymentsQuery.refresh();
		await expensesQuery.refresh();
		setDeleteAction(false);
	}

	async function handleExport() {
		showProgress('Generating Excel...');

		try {
			// Build payload based on current filter mode
			const payload =
				dateFilterMode === 'period'
					? { mode: 'period', days: selectedDays }
					: { mode: 'range', startDate: rangeStartString, endDate: rangeEndString };

			const response = await fetch('/app/settings/register_settings/api/export', {
				method: 'POST',
				body: JSON.stringify(payload),
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) throw new Error('Export failed');

			// Handle file download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `register_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error(error);
			showFailToast('Export Error', 'Could not generate Excel file');
		} finally {
			hideProgress();
		}
	}
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
			<!-- Settings Page -->
			<div class="flex items-center gap-2">
				<span>Date Filter Style:</span>
				<Select.Root
					type="single"
					value={dateFilterMode}
					onValueChange={(v) => (dateFilterMode = v as 'period' | 'range')}
				>
					<Select.Trigger>
						{dateFilterMode === 'period' ? 'Time Period' : 'Date Range'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="period">Time Period (Quick)</Select.Item>
						<Select.Item value="range">Date Range Picker</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Table Page -->
			{#if dateFilterMode === 'period'}
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
			{:else}
				<div class="flex items-center gap-4">
					<span class="text-sm font-medium text-muted-foreground">Range Picker:</span>
					<RangeDatePicker bind:rangeStart bind:rangeEnd />
				</div>
			{/if}

			<!-- Analytics Cards -->
			<LineChartCard {registerData} {percentageChange} {selectedPeriodLabel} />

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				{#if supplierData && supplierData.length > 0}
					<PieChartCard
						{supplierData}
						{currentStartDate}
						{currentEndDate}
						{countSuppliers}
						{totalSupplierPayments}
					/>
				{:else}
					<div
						class="flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-6"
					>
						<div class="flex flex-col items-center justify-center gap-4 py-12">
							<Spinner class="size-4" />
							<p class="text-center text-muted-foreground">no data...</p>
						</div>
					</div>
				{/if}
				<ArcChartCard {expensesData} {selectedDays} />
			</div>

			<!-- Register Data Table Section -->
			<div class="space-y-4">
				<div class="space-y-2">
					<h2 class="text-2xl font-semibold text-neutral-800">Κλείσιμο ταμείων</h2>
					<p class="text-sm text-muted-foreground">
						Όλα τα αρχεία κλεισίματος για την επιλεγμένη περίοδο
					</p>
				</div>
				<div class="flex items-center gap-2">
					<Button variant="default" class="ml-auto gap-2" onclick={handleExport}>
						<FileSpreadsheet class="h-4 w-4" />
						Export Excel
					</Button>
				</div>
				<RegisterDataTable data={tableData} columns={registerColumns} bind:pagination />
			</div>
		</main>
	</div>
{/if}

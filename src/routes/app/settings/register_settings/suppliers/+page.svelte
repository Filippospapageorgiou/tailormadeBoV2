<script lang="ts">
	import { getSupplierPaymentsTable } from './data.remote';
	import { type PaginationState } from '@tanstack/table-core';
	import * as Select from '$lib/components/ui/select';
	import DataTable from '../data-table.svelte';
	import { supplierColumns } from './columns';
	import RangeDatePicker from '$lib/components/custom/register_settings/rangeDatePicker.svelte';
	import { getLocalTimeZone, now } from '@internationalized/date';
	import Button from '$lib/components/ui/button/button.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { goto } from '$app/navigation';

	let dateFilterMode = $state<'period' | 'range'>('period');

	function calendarDateToString(calendarDate: any): string {
		if (!calendarDate) {
			return '';
		}

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

		if (calendarDate instanceof Date) {
			const year = calendarDate.getFullYear();
			const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
			const day = String(calendarDate.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		}

		if (typeof calendarDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) {
			return calendarDate;
		}

		return '';
	}

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });

	// State for time period selection
	let selectedDays = $state(30);

	// Date range state
	let rangeStart = $state(now(getLocalTimeZone()).subtract({ days: 7 }));
	let rangeEnd = $state(now(getLocalTimeZone()));

	// Computed string versions for queries
	let rangeStartString = $derived(calendarDateToString(rangeStart));
	let rangeEndString = $derived(calendarDateToString(rangeEnd));

	// Query for supplier payments
	let supplierPaymentsQuery = $derived.by(() => {
		if (dateFilterMode === 'period') {
			return getSupplierPaymentsTable({
				mode: 'period' as const,
				days: selectedDays
			});
		} else {
			return getSupplierPaymentsTable({
				mode: 'range' as const,
				startDate: rangeStartString,
				endDate: rangeEndString
			});
		}
	});

	let tableData = $derived(supplierPaymentsQuery.current?.data ?? []);
	let currentStartDate = $derived(supplierPaymentsQuery.current?.currentStartDate);
	let currentEndDate = $derived(supplierPaymentsQuery.current?.currentEndDate);
	let total = $derived(supplierPaymentsQuery.current?.total || 0);

	// Time period options
	const periodOptions = [
		{ value: '7', label: 'Last 7 Days' },
		{ value: '15', label: 'Last 15 Days' },
		{ value: '30', label: 'Last 30 Days' }
	];

	let selectedPeriodLabel = $derived(
		periodOptions.find((opt) => opt.value === String(selectedDays))?.label || 'Last 30 Days'
	);

	// Format date range for display
	function formatDateRange(start: string, end: string): string {
		if (!start || !end) return '';
		const startDate = new Date(start);
		const endDate = new Date(end);
		const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		return `${startDate.toLocaleDateString('el-GR', options)} - ${endDate.toLocaleDateString('el-GR', options)}`;
	}

	function handleBack() {
		goto('/app/settings/register_settings');
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto space-y-6 px-4 py-6 md:px-6">
		<!-- Header with Back Button -->
		<div class="flex items-center gap-4">
			<Button
				variant="outline"
				size="icon"
				onclick={handleBack}
				class="rounded-lg border border-border hover:bg-muted"
			>
				<ArrowLeftIcon class="h-4 w-4" />
			</Button>
			<div class="space-y-1">
				<h1 class="font-mono text-3xl tracking-wider text-neutral-800 md:text-4xl">
					Πληρωμές Προμηθευτών
				</h1>
				<p class="text-sm text-muted-foreground">
					Προβολή όλων των πληρωμών προμηθευτών για την επιλεγμένη περίοδο
				</p>
			</div>
		</div>

		<!-- Date Filter Mode Selector -->
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-muted-foreground">Date Filter Style:</span>
			<Select.Root
				type="single"
				value={dateFilterMode}
				onValueChange={(v) => (dateFilterMode = v as 'period' | 'range')}
			>
				<Select.Trigger class="w-[180px]">
					{dateFilterMode === 'period' ? 'Time Period' : 'Date Range'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="period">Time Period (Quick)</Select.Item>
					<Select.Item value="range">Date Range Picker</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>

		<!-- Time Period / Date Range Selector -->
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

		<!-- Date Range Display -->
		{#if currentStartDate && currentEndDate}
			<p class="text-sm text-muted-foreground">
				Showing payments from: {formatDateRange(currentStartDate, currentEndDate)}
			</p>
			<p>
				Συνολικές Πληρωμές : {new Intl.NumberFormat('el-GR', {
					style: 'currency',
					currency: 'EUR',
					minimumFractionDigits: 2
				}).format(total)}
			</p>
		{/if}

		<!-- Data Table -->
		<div class="space-y-4">
			<DataTable data={tableData} columns={supplierColumns} bind:pagination />
		</div>
	</main>
</div>

<script lang="ts">
	import {
		type ColumnDef,
		type PaginationState,
		type SortingState,
		type ColumnFiltersState,
		type VisibilityState,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		getFilteredRowModel,
		getFacetedRowModel,
		getFacetedUniqueValues
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		ChevronLeft,
		ChevronRight,
		ChevronsLeft,
		ChevronsRight
	} from 'lucide-svelte';
	import type { BonusPeriod } from '$lib/models/bonus_organization.types';
	import BonusPeriodToolBar from './BonusPeriodToolBar.svelte';
	import { HIDDEN_COLUMNS } from './bonus-periods-columns';

	type Props = {
		columns: ColumnDef<BonusPeriod, unknown>[];
		data: BonusPeriod[];
		isLoading?: boolean;
	};

	let { columns, data, isLoading = false }: Props = $props();

	// Table state
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([{ id: 'period', desc: true }]); // Default sort by period descending
	let columnFilters = $state<ColumnFiltersState>([]);
	
	// Initialize column visibility - hide filter-only columns
	let columnVisibility = $state<VisibilityState>({
		id: false,
		year: false,
		quarter: false
	});

	// Create the table instance
	const table = createSvelteTable({
		get data() {
			return data;
		},
		// svelte-ignore state_referenced_locally
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === 'function') {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		},
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			},
			get columnVisibility() {
				return columnVisibility;
			}
		}
	});
</script>

<div class="w-full space-y-4">
	<!-- Toolbar with filters -->
	<BonusPeriodToolBar {table} {data} />

	<!-- Table -->
	<div class="rounded-md border border-border/50">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head
								class={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
							>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#if isLoading}
					<!-- Loading skeleton -->
					{#each Array(5) as _, i}
						<Table.Row>
							{#each table.getVisibleLeafColumns() as _, j}
								<Table.Cell>
									<Skeleton class="h-8 w-full" />
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				{:else if table.getRowModel().rows.length === 0}
					<!-- Empty state -->
					<Table.Row>
						<Table.Cell
							colspan={table.getVisibleLeafColumns().length}
							class="h-24 text-center"
						>
							<div class="flex flex-col items-center justify-center py-8">
								<p class="text-muted-foreground">Δεν βρέθηκαν εγγραφές</p>
								{#if columnFilters.length > 0}
									<Button
										variant="link"
										class="mt-2"
										onclick={() => table.resetColumnFilters()}
									>
										Καθαρισμός φίλτρων
									</Button>
								{/if}
							</div>
						</Table.Cell>
					</Table.Row>
				{:else}
					<!-- Data rows -->
					{#each table.getRowModel().rows as row, index (row.id)}
						<Table.Row
							class="animate-fade-in-down"
							style="animation-delay: {index * 50}ms;"
							data-state={row.getIsSelected() && 'selected'}
						>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell>
									<FlexRender
										content={cell.column.columnDef.cell}
										context={cell.getContext()}
									/>
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Pagination -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<!-- Left side: Row count -->
		<div class="text-sm text-muted-foreground">
			Εμφάνιση {table.getRowModel().rows.length} από {table.getFilteredRowModel().rows.length} εγγραφές
			{#if table.getFilteredRowModel().rows.length !== data.length}
				<span class="text-xs">(σύνολο: {data.length})</span>
			{/if}
		</div>

		<!-- Right side: Pagination controls -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 lg:gap-8">
			<!-- Rows per page selector -->
			<div class="flex items-center space-x-2">
				<p class="text-sm font-medium">Ανά σελίδα</p>
				<Select.Root
					type="single"
					value={String(table.getState().pagination.pageSize)}
					onValueChange={(value) => {
						if (value) table.setPageSize(Number(value));
					}}
				>
					<Select.Trigger class="h-8 w-[70px]">
						{table.getState().pagination.pageSize}
					</Select.Trigger>
					<Select.Content side="top">
						{#each [5, 10, 20, 30, 50] as pageSize (pageSize)}
							<Select.Item value={String(pageSize)}>
								{pageSize}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Page indicator -->
			<div class="flex w-[100px] items-center justify-center text-sm font-medium">
				Σελίδα {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
			</div>

			<!-- Navigation buttons -->
			<div class="flex items-center space-x-2">
				<!-- First page -->
				<Button
					variant="outline"
					class="hidden h-8 w-8 p-0 lg:flex"
					onclick={() => table.setPageIndex(0)}
					disabled={!table.getCanPreviousPage()}
				>
					<span class="sr-only">Πρώτη σελίδα</span>
					<ChevronsLeft class="h-4 w-4" />
				</Button>

				<!-- Previous page -->
				<Button
					variant="outline"
					class="h-8 w-8 p-0"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					<span class="sr-only">Προηγούμενη σελίδα</span>
					<ChevronLeft class="h-4 w-4" />
				</Button>

				<!-- Next page -->
				<Button
					variant="outline"
					class="h-8 w-8 p-0"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					<span class="sr-only">Επόμενη σελίδα</span>
					<ChevronRight class="h-4 w-4" />
				</Button>

				<!-- Last page -->
				<Button
					variant="outline"
					class="hidden h-8 w-8 p-0 lg:flex"
					onclick={() => table.setPageIndex(table.getPageCount() - 1)}
					disabled={!table.getCanNextPage()}
				>
					<span class="sr-only">Τελευταία σελίδα</span>
					<ChevronsRight class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
</div>
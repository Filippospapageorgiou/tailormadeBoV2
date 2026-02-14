<script lang="ts" generics="TData, TValue">
	import {
		type ColumnDef,
		type PaginationState,
		type SortingState,
		type ColumnFiltersState,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		getFilteredRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import RangeDatePicker from '$lib/components/custom/register_settings/rangeDatePicker.svelte';
	import * as Select from '$lib/components/ui/select';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
		pagination: PaginationState;
		manualPagination?: boolean;
		rowCount?: number;
	};

	let { columns, data, pagination = $bindable(), manualPagination = false, rowCount }: DataTableProps<TData, TValue> = $props();

	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);

	const table = createSvelteTable({
		get data() {
			return data;
		},
		// svelte-ignore state_referenced_locally
		columns,
		getCoreRowModel: getCoreRowModel(),
		// svelte-ignore state_referenced_locally
		getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		get manualPagination() {
			return manualPagination;
		},
		get rowCount() {
			return rowCount;
		},
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
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			}
		}
	});
</script>

<div class="space-y-4">
	<!-- Table Container -->
	<div class="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row class="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
						{#each headerGroup.headers as header (header.id)}
							<Table.Head
								colspan={header.colSpan}
								class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
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
				{#each table.getRowModel().rows as row, i (row.id)}
					<Table.Row
						data-state={row.getIsSelected() && 'selected'}
						class="border-b border-border/40 transition-colors"
					>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell class="px-3 py-3">
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-32 text-center">
							<div class="flex flex-col items-center justify-center gap-3 text-muted-foreground">
								<Spinner />
								<p class="text-sm">Φόρτωση δεδομένων...</p>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Pagination Controls -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<!-- Left side: Row count -->
		<p class="text-sm text-muted-foreground">
			{table.getRowModel().rows.length} από {table.getFilteredRowModel().rows.length} εγγραφές
		</p>

		<!-- Right side: Controls -->
		<div class="flex items-center gap-4">
			<!-- Rows per page -->
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">Ανά σελίδα</span>
				<Select.Root
					allowDeselect={false}
					type="single"
					value={`${table.getState().pagination.pageSize}`}
					onValueChange={(value) => {
						table.setPageSize(Number(value));
					}}
				>
					<Select.Trigger class="h-8 w-16">
						{String(table.getState().pagination.pageSize)}
					</Select.Trigger>
					<Select.Content side="top">
						{#each [10, 15, 20, 30] as pageSize (pageSize)}
							<Select.Item value={`${pageSize}`}>
								{pageSize}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Page indicator -->
			<span class="text-sm tabular-nums text-muted-foreground">
				{table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
			</span>

			<!-- Navigation buttons -->
			<div class="flex items-center gap-1">
				<Button
					variant="outline"
					class="hidden size-8 p-0 lg:flex"
					onclick={() => table.setPageIndex(0)}
					disabled={!table.getCanPreviousPage()}
				>
					<span class="sr-only">Πρώτη σελίδα</span>
					<ChevronsLeftIcon class="h-4 w-4" />
				</Button>

				<Button
					variant="outline"
					class="size-8 p-0"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					<span class="sr-only">Προηγούμενη σελίδα</span>
					<ChevronLeftIcon class="h-4 w-4" />
				</Button>

				<Button
					variant="outline"
					class="size-8 p-0"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					<span class="sr-only">Επόμενη σελίδα</span>
					<ChevronRightIcon class="h-4 w-4" />
				</Button>

				<Button
					variant="outline"
					class="hidden size-8 p-0 lg:flex"
					onclick={() => table.setPageIndex(table.getPageCount() - 1)}
					disabled={!table.getCanNextPage()}
				>
					<span class="sr-only">Τελευταία σελίδα</span>
					<ChevronsRightIcon class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
</div>

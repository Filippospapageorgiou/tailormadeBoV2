<script lang="ts" generics="TData, TValue">
	import {
		type ColumnDef,
		type PaginationState,
		type SortingState,
		type ColumnFiltersState,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		getFilteredRowModel,
		getFacetedRowModel,        // ADD THIS
		getFacetedUniqueValues     // ADD THIS
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { roles } from './data';
	import DataTableFacetedFilter from './data-table-faceted-filter.svelte';  // ADD THIS
    import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";     // ADD THIS
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";       // ADD THIS
	import ChevronsLeftIcon from "@lucide/svelte/icons/chevrons-left";     // ADD THIS
	import ChevronsRightIcon from "@lucide/svelte/icons/chevrons-right";
    import * as Select from '$lib/components/ui/select';  // ADD THIS IMPORT

	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
	};

	let { columns, data }: DataTableProps<TData, TValue> = $props();

	

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),              // ADD THIS
		getFacetedUniqueValues: getFacetedUniqueValues(),      // ADD THIS
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

<div class="flex items-center py-4 gap-2">
	<Input
		placeholder="Filter emails..."
		value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
		onchange={(e) => {
			table.getColumn("email")?.setFilterValue(e.currentTarget.value);
		}}
		oninput={(e) => {
			table.getColumn("email")?.setFilterValue(e.currentTarget.value);
		}}
		class="max-w-sm"
	/>
	
	<!-- ADD THIS: Role Filter -->
	{#if table.getColumn("role_name")}
		<DataTableFacetedFilter
			column={table.getColumn("role_name")!}
			title="Role"
			options={roles}
		/>
	{/if}
</div>

{#snippet roleCell({ value }: { value: string })}
	{@const role = roles.find((role) => role.value === value)}
	{#if role}
		<div class="flex items-center">
			<span>{role.label}</span>
		</div>
	{/if}
{/snippet}

<!-- Rest of your table code remains the same -->
<div class="rounded-md">
	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head colspan={header.colSpan}>
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
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row data-state={row.getIsSelected() && 'selected'}>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell>
							<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
<!-- REPLACE YOUR OLD PAGINATION WITH THIS NEW ONE -->
<div class="flex items-center justify-between px-2 py-4">
	<!-- Left side: Selected rows info (optional, you can remove if not using row selection) -->
	<div class="text-muted-foreground flex-1 text-sm">
		Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s).
	</div>
	
	<!-- Right side: Pagination controls -->
	<div class="flex items-center space-x-6 lg:space-x-8">
		<!-- Rows per page selector -->
		<div class="flex items-center space-x-2">
			<p class="text-sm font-medium">Rows per page</p>
			<Select.Root
				allowDeselect={false}
				type="single"
				value={`${table.getState().pagination.pageSize}`}
				onValueChange={(value) => {
					table.setPageSize(Number(value));
				}}
			>
				<Select.Trigger class="h-8 w-[70px]">
					{String(table.getState().pagination.pageSize)}
				</Select.Trigger>
				<Select.Content side="top">
					{#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
						<Select.Item value={`${pageSize}`}>
							{pageSize}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		
		<!-- Page number display -->
		<div class="flex w-[100px] items-center justify-center text-sm font-medium">
			Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
		</div>
		
		<!-- Navigation buttons -->
		<div class="flex items-center space-x-2">
			<!-- First page -->
			<Button
				variant="outline"
				class="hidden size-8 p-0 lg:flex"
				onclick={() => table.setPageIndex(0)}
				disabled={!table.getCanPreviousPage()}
			>
				<span class="sr-only">Go to first page</span>
				<ChevronsLeftIcon />
			</Button>
			
			<!-- Previous page -->
			<Button
				variant="outline"
				class="size-8 p-0"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				<span class="sr-only">Go to previous page</span>
				<ChevronLeftIcon />
			</Button>
			
			<!-- Next page -->
			<Button
				variant="outline"
				class="size-8 p-0"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				<span class="sr-only">Go to next page</span>
				<ChevronRightIcon />
			</Button>
			
			<!-- Last page -->
			<Button
				variant="outline"
				class="hidden size-8 p-0 lg:flex"
				onclick={() => table.setPageIndex(table.getPageCount() - 1)}
				disabled={!table.getCanNextPage()}
			>
				<span class="sr-only">Go to last page</span>
				<ChevronsRightIcon />
			</Button>
		</div>
	</div>
</div>
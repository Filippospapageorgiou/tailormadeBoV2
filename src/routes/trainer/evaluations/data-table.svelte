<script lang="ts">
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type PaginationState,
		type RowSelectionState,
		type SortingState,
		type VisibilityState,
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel
	} from '@tanstack/table-core';
	import { createRawSnippet } from 'svelte';
	import {
		FlexRender,
		createSvelteTable,
		renderComponent,
		renderSnippet
	} from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		ChevronsLeft,
		ChevronsRight,
		Search,
		SlidersHorizontal,
		ClipboardList
	} from 'lucide-svelte';

	import DataTableSortButton from '../../app/managment/trainers/data-table/data-table-sort-button.svelte';
	import DataTableStatusBadge from '../../app/managment/trainers/data-table/data-table-status-badge.svelte';
	import DataTableScoreBar from '../../app/managment/trainers/data-table/data-table-score-bar.svelte';
	import DataTableActions from './data-table-actions.svelte';

	// ─── Types ───────────────────────────────────────────────────────────
	type EvaluationRow = {
		id: number;
		org_id: number;
		visit_date: string;
		submit: string;
		overall_rating: number | null;
		submitted_at: string | null;
		created_at: string;
		is_emergency: boolean;
		core_organizations: {
			id: number;
			store_name: string;
			location: string | null;
		} | null;
	};

	// ─── Props ────────────────────────────────────────────────────────────
	let { data = [] }: { data: EvaluationRow[] } = $props();

	// ─── Column Definitions ───────────────────────────────────────────────
	const columns: ColumnDef<EvaluationRow>[] = [
		// Store Name
		{
			id: 'store_name',
			accessorFn: (row) => row.core_organizations?.store_name ?? '',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Κατάστημα',
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ name: string; location: string }]>((getData) => {
					const { name, location } = getData();
					return {
						render: () =>
							`<div>
								<p class="font-medium text-sm truncate max-w-[200px]">${name}</p>
								${location ? `<p class="text-[11px] text-muted-foreground truncate max-w-[200px]">${location}</p>` : ''}
							</div>`
					};
				});
				return renderSnippet(snippet, {
					name: row.original.core_organizations?.store_name ?? '—',
					location: row.original.core_organizations?.location ?? ''
				});
			}
		},

		// Visit Date
		{
			accessorKey: 'visit_date',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Ημ/νία Επίσκεψης',
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ formatted: string; relative: string }]>((getData) => {
					const { formatted, relative } = getData();
					return {
						render: () =>
							`<div>
								<p class="text-sm font-medium">${formatted}</p>
								<p class="text-[11px] text-muted-foreground">${relative}</p>
							</div>`
					};
				});

				const date = new Date(row.original.visit_date);
				const formatted = date.toLocaleDateString('el-GR', {
					day: '2-digit',
					month: 'short',
					year: 'numeric'
				});

				const now = new Date();
				const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
				let relative = '';
				if (diffDays === 0) relative = 'Σήμερα';
				else if (diffDays === 1) relative = 'Χθες';
				else if (diffDays < 0) relative = `Σε ${Math.abs(diffDays)} ημέρες`;
				else if (diffDays < 30) relative = `${diffDays} ημέρες πριν`;
				else if (diffDays < 365) relative = `${Math.floor(diffDays / 30)} μήνες πριν`;
				else relative = `${Math.floor(diffDays / 365)} χρόνια πριν`;

				return renderSnippet(snippet, { formatted, relative });
			}
		},

		// Status
		{
			id: 'status',
			accessorKey: 'status',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Κατάσταση',
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) =>
				renderComponent(DataTableStatusBadge, {
					status: row.original.submit ?? 'draft'
				}),
			filterFn: (row, _id, filterValue) => {
				if (!filterValue) return true;
				return row.original.submit === filterValue;
			}
		},

		// Overall Score
		{
			accessorKey: 'overall_rating',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Βαθμολογία',
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) =>
				renderComponent(DataTableScoreBar, {
					score: row.original.overall_rating
				})
		},
		{
			id: 'is_emergency',
			accessorKey: 'is_emergency',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Τύπος',
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const isEmergency = row.original.is_emergency ?? false;
				const snippet = createRawSnippet<[{ emergency: boolean }]>((getData) => {
					const { emergency } = getData();
					return {
						render: () =>
							emergency
								? `<div class="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                        Έκτακτη
                   </div>`
								: `<div class="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
                        Κανονική
                   </div>`
					};
				});
				return renderSnippet(snippet, { emergency: isEmergency });
			}
		},

		{
			accessorKey: 'submitted_at',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Υποβλήθηκε',
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[any]>((getDate) => {
					const d = getDate();
					if (!d) return { render: () => `<span class="text-xs text-muted-foreground">—</span>` };
					const dateStr = typeof d === 'string' ? d : Object.values(d).join('');
					const date = new Date(dateStr);
					if (isNaN(date.getTime()))
						return { render: () => `<span class="text-xs text-muted-foreground">—</span>` };
					const formatted = date.toLocaleDateString('el-GR', {
						day: '2-digit',
						month: 'short',
						year: 'numeric',
						timeZone: 'Europe/Athens'
					});
					return {
						render: () => `<span class="text-xs text-muted-foreground">${formatted}</span>`
					};
				});
				return renderSnippet(snippet, row.original.submitted_at);
			}
		},

		// Actions
		{
			id: 'actions',
			enableHiding: false,
			cell: ({ row }) =>
				renderComponent(DataTableActions, {
					id: row.original.id,
					status: row.original.submit
				})
		}
	];

	// ─── Table State ──────────────────────────────────────────────────────
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([{ id: 'visit_date', desc: true }]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let rowSelection = $state<RowSelectionState>({});
	let columnVisibility = $state<VisibilityState>({});

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get rowSelection() {
				return rowSelection;
			},
			get columnFilters() {
				return columnFilters;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
		},
		onSortingChange: (updater) => {
			sorting = typeof updater === 'function' ? updater(sorting) : updater;
		},
		onColumnFiltersChange: (updater) => {
			columnFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
		},
		onColumnVisibilityChange: (updater) => {
			columnVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
		},
		onRowSelectionChange: (updater) => {
			rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
		}
	});

	// ─── Derived ─────────────────────────────────────────────────────────
	let totalRows = $derived(table.getFilteredRowModel().rows.length);
	let currentPage = $derived(pagination.pageIndex + 1);
	let totalPages = $derived(table.getPageCount());
	let pageStart = $derived(pagination.pageIndex * pagination.pageSize + 1);
	let pageEnd = $derived(Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows));

	// Active status filter label for the button
	let activeStatusFilter = $derived(
		(table.getColumn('status')?.getFilterValue() as string | undefined) ?? null
	);
	const statusLabels: Record<string, string> = {
		draft: 'Πρόχειρο',
		submitted: 'Υποβλήθηκε',
		reviewed: 'Αξιολογήθηκε',
		reopened: 'Επαναλήφθηκε'
	};
</script>

<div class="w-full space-y-4 py-6">
	<!-- ─── Toolbar ─────────────────────────────────────────────────────── -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-2">
			<ClipboardList class="h-5 w-5 text-muted-foreground" />
			<h3 class="font-mono text-lg font-semibold tracking-wide">Οι Αξιολογήσεις Μου</h3>
			{#if totalRows > 0}
				<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
					{totalRows}
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<!-- Search by store -->
			<div class="relative">
				<Search class="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Αναζήτηση καταστήματος..."
					value={(table.getColumn('store_name')?.getFilterValue() as string) ?? ''}
					oninput={(e) => table.getColumn('store_name')?.setFilterValue(e.currentTarget.value)}
					onchange={(e) => table.getColumn('store_name')?.setFilterValue(e.currentTarget.value)}
					class="h-9 w-[200px] pl-8 sm:w-[240px]"
				/>
			</div>

			<!-- Status filter -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props }: { props: any })}
						<Button
							{...props}
							variant={activeStatusFilter ? 'default' : 'outline'}
							size="sm"
							class="h-9 gap-1.5"
						>
							<SlidersHorizontal class="h-3.5 w-3.5" />
							<span class="hidden sm:inline">
								{activeStatusFilter ? statusLabels[activeStatusFilter] : 'Κατάσταση'}
							</span>
							<ChevronDown class="h-3 w-3" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-44">
					<DropdownMenu.Label>Φίλτρο Κατάστασης</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item
						onclick={() => table.getColumn('status')?.setFilterValue(undefined)}
						class={!activeStatusFilter ? 'bg-muted/50 font-medium' : ''}
					>
						Όλες
					</DropdownMenu.Item>
					{#each Object.entries(statusLabels) as [value, label]}
						<DropdownMenu.Item
							onclick={() => table.getColumn('status')?.setFilterValue(value)}
							class={activeStatusFilter === value ? 'bg-muted/50 font-medium' : ''}
						>
							{label}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Column visibility -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props }: { props: any })}
						<Button {...props} variant="outline" size="sm" class="h-9 gap-1.5">
							Στήλες <ChevronDown class="h-3.5 w-3.5" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					{#each table.getAllColumns().filter((col) => col.getCanHide()) as column (column.id)}
						<DropdownMenu.CheckboxItem
							class="capitalize"
							bind:checked={() => column.getIsVisible(), (v) => column.toggleVisibility(!!v)}
						>
							{column.id === 'store_name'
								? 'Κατάστημα'
								: column.id === 'visit_date'
									? 'Ημερομηνία'
									: column.id === 'status'
										? 'Κατάσταση'
										: column.id === 'overall_rating'
											? 'Βαθμολογία'
											: column.id === 'submitted_at'
												? 'Υποβολή'
												: column.id}
						</DropdownMenu.CheckboxItem>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	<!-- ─── Table ────────────────────────────────────────────────────────── -->
	<div class="overflow-hidden rounded-xl border border-border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row class="hover:bg-transparent">
						{#each headerGroup.headers as header (header.id)}
							<Table.Head
								class="bg-muted/30 text-xs font-medium tracking-wider text-muted-foreground uppercase [&:has([role=checkbox])]:ps-3"
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
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row
						data-state={row.getIsSelected() && 'selected'}
						class="transition-colors hover:bg-muted/30"
					>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell class="py-3 [&:has([role=checkbox])]:ps-3">
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-32 text-center">
							<div class="flex flex-col items-center gap-2 text-muted-foreground">
								<ClipboardList class="h-8 w-8 opacity-30" />
								<p class="text-sm">Δεν βρέθηκαν αξιολογήσεις</p>
								{#if activeStatusFilter}
									<button
										class="text-xs text-primary underline-offset-2 hover:underline"
										onclick={() => table.getColumn('status')?.setFilterValue(undefined)}
									>
										Καθαρισμός φίλτρου
									</button>
								{/if}
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- ─── Footer / Pagination ──────────────────────────────────────────── -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="text-sm text-muted-foreground">
			{#if totalRows > 0}
				Εμφάνιση {pageStart}–{pageEnd} από {totalRows} αξιολογήσεις
			{:else}
				Δεν υπάρχουν αποτελέσματα
			{/if}
		</div>

		<div class="flex items-center gap-1.5">
			<!-- Page size -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props }: { props: any })}
						<Button {...props} variant="outline" size="sm" class="h-8 gap-1 text-xs">
							{pagination.pageSize} / σελίδα
							<ChevronDown class="h-3 w-3" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					{#each [5, 10, 20, 50] as size}
						<DropdownMenu.Item
							onclick={() => {
								pagination = { ...pagination, pageSize: size, pageIndex: 0 };
							}}
						>
							{size} / σελίδα
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Navigation -->
			<div class="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					onclick={() => table.setPageIndex(0)}
					disabled={!table.getCanPreviousPage()}
				>
					<ChevronsLeft class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					<ChevronLeft class="h-4 w-4" />
				</Button>
				<span class="px-2 text-sm text-muted-foreground tabular-nums">
					{currentPage} / {totalPages || 1}
				</span>
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					<ChevronRight class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					onclick={() => table.setPageIndex(table.getPageCount() - 1)}
					disabled={!table.getCanNextPage()}
				>
					<ChevronsRight class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
</div>

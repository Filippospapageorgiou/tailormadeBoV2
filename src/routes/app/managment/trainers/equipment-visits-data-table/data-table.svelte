<script lang="ts">
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type PaginationState,
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
		Wrench
	} from '@lucide/svelte';

	import DataTableSortButton from '../../trainers/data-table/data-table-sort-button.svelte';
	import DataTableActions from './data-table-actions.svelte';
	import DataTableStatusBadge from './data-table-status-badge.svelte';

	let {
		data = [],
		basePath = ''
	}: {
		data: any[];
		basePath: string;
	} = $props();

	// ─── Column Definitions ───
	const columns: ColumnDef<any>[] = [
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
								<p class="text-[11px] text-muted-foreground truncate max-w-[200px]">${location}</p>
							</div>`
					};
				});
				return renderSnippet(snippet, {
					name: row.original.core_organizations?.store_name ?? '—',
					location: row.original.core_organizations?.location ?? ''
				});
			}
		},

		// Trainer
		{
			id: 'trainer',
			accessorFn: (row) => row.profiles?.full_name ?? row.profiles?.username ?? '',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Εκπαιδευτής',
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<
					[{ name: string; email: string; imageUrl: string; initials: string }]
				>((getData) => {
					const { name, email, imageUrl, initials } = getData();
					return {
						render: () =>
							`<div class="flex items-center gap-2.5">
								<div class="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
									<img src="${imageUrl}" alt="${name}" class="h-full w-full object-cover dark:bg-white" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
									<span style="display:none" class="absolute inset-0 items-center justify-center text-[10px] font-semibold text-muted-foreground">${initials}</span>
								</div>
								<div>
									<p class="text-sm font-medium leading-tight">${name}</p>
									<p class="text-[11px] text-muted-foreground">${email}</p>
								</div>
							</div>`
					};
				});

				const profile = row.original.profiles;
				const fullName = profile?.full_name ?? profile?.username ?? '—';
				const initials = fullName
					.split(' ')
					.map((n: string) => n[0])
					.slice(0, 2)
					.join('')
					.toUpperCase();

				return renderSnippet(snippet, {
					name: fullName,
					email: profile?.email ?? '',
					imageUrl: profile?.image_url ?? '',
					initials
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
								<p class="text-sm">${formatted}</p>
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

		// Actions Count
		{
			id: 'action_count',
			accessorKey: 'action_count',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Ενέργειες',
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ count: number }]>((getData) => {
					const { count } = getData();
					return {
						render: () =>
							`<span class="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-xs font-semibold tabular-nums">${count}</span>`
					};
				});
				return renderSnippet(snippet, { count: row.original.action_count ?? 0 });
			}
		},

		// Total Cost
		{
			id: 'total_cost',
			accessorKey: 'total_cost',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Κόστος',
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ cost: string }]>((getData) => {
					const { cost } = getData();
					return {
						render: () => `<span class="text-sm font-medium tabular-nums">${cost}</span>`
					};
				});
				const cost = row.original.total_cost ?? 0;
				return renderSnippet(snippet, {
					cost: cost > 0 ? `${cost.toFixed(2)}€` : '—'
				});
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
					status: row.original.status ?? 'in_progress'
				})
		},

		// Actions
		{
			id: 'actions',
			enableHiding: false,
			cell: ({ row }) =>
				renderComponent(DataTableActions, {
					id: row.original.id,
					basePath: basePath
				})
		}
	];

	// ─── Table State ───
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([{ id: 'visit_date', desc: true }]);
	let columnFilters = $state<ColumnFiltersState>([]);
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
			get columnFilters() {
				return columnFilters;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
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
		}
	});

	// ─── Derived ───
	let uniqueTrainers = $derived.by(() => {
		const seen = new Map<string, string>();
		for (const row of data) {
			const id = row.profiles?.id;
			const name = row.profiles?.full_name ?? row.profiles?.username ?? '';
			if (id && !seen.has(id)) seen.set(id, name);
		}
		return Array.from(seen.entries())
			.map(([id, name]) => ({ id, name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	let totalRows = $derived(table.getFilteredRowModel().rows.length);
	let currentPage = $derived(pagination.pageIndex + 1);
	let totalPages = $derived(table.getPageCount());
	let pageStart = $derived(pagination.pageIndex * pagination.pageSize + 1);
	let pageEnd = $derived(Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows));
</script>

<div class="w-full space-y-4 py-6">
	<!-- ─── Toolbar ─── -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-2">
			<Wrench class="h-5 w-5 text-muted-foreground" />
			<h3 class="font-tailormade text-lg font-semibold">Επισκέψεις Εξοπλισμού</h3>
		</div>

		<div class="flex items-center gap-2">
			<!-- Search -->
			<div class="relative">
				<Search class="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Αναζήτηση καταστήματος..."
					value={(table.getColumn('store_name')?.getFilterValue() as string) ?? ''}
					oninput={(e) => table.getColumn('store_name')?.setFilterValue(e.currentTarget.value)}
					onchange={(e) => table.getColumn('store_name')?.setFilterValue(e.currentTarget.value)}
					class="h-9 w-[200px] pl-8 sm:w-[260px]"
				/>
			</div>

			<!-- Trainer Filter -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline" size="sm" class="h-9 gap-1.5">
							<span class="hidden sm:inline">Εκπαιδευτής</span>
							<ChevronDown class="h-3.5 w-3.5" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="max-h-60 w-48 overflow-y-auto">
					<DropdownMenu.Label>Εκπαιδευτής</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onclick={() => table.getColumn('trainer')?.setFilterValue(undefined)}>
						Όλοι
					</DropdownMenu.Item>
					{#each uniqueTrainers as trainer (trainer.id)}
						<DropdownMenu.Item
							onclick={() => table.getColumn('trainer')?.setFilterValue(trainer.name)}
						>
							{trainer.name}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Status Filter -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline" size="sm" class="h-9 gap-1.5">
							<SlidersHorizontal class="h-3.5 w-3.5" />
							<span class="hidden sm:inline">Φίλτρα</span>
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-40">
					<DropdownMenu.Label>Κατάσταση</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onclick={() => table.getColumn('status')?.setFilterValue(undefined)}>
						Όλες
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => table.getColumn('status')?.setFilterValue('completed')}>
						Ολοκληρωμένη
					</DropdownMenu.Item>
					<DropdownMenu.Item
						onclick={() => table.getColumn('status')?.setFilterValue('in_progress')}
					>
						Σε εξέλιξη
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Column Visibility -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
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
								: column.id === 'trainer'
									? 'Εκπαιδευτής'
									: column.id === 'visit_date'
										? 'Ημερομηνία'
										: column.id === 'status'
											? 'Κατάσταση'
											: column.id === 'action_count'
												? 'Ενέργειες'
												: column.id === 'total_cost'
													? 'Κόστος'
													: column.id}
						</DropdownMenu.CheckboxItem>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	<!-- ─── Table ─── -->
	<div class="overflow-hidden rounded-xl border border-border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row class="hover:bg-transparent">
						{#each headerGroup.headers as header (header.id)}
							<Table.Head
								class="bg-muted/30 text-xs font-medium tracking-wider text-muted-foreground uppercase"
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
							<Table.Cell class="py-3">
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-32 text-center">
							<div class="flex flex-col items-center gap-2 text-muted-foreground">
								<Wrench class="h-8 w-8 opacity-30" />
								<p class="text-sm">Δεν βρέθηκαν επισκέψεις</p>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- ─── Footer: Pagination ─── -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="text-sm text-muted-foreground">
			{#if totalRows > 0}
				Εμφάνιση {pageStart} - {pageEnd} από {totalRows} επισκέψεις
			{:else}
				Δεν υπάρχουν αποτελέσματα
			{/if}
		</div>

		<div class="flex items-center gap-1.5">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
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
					{currentPage} / {totalPages}
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

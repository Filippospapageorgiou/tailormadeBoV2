import type { ColumnDef } from '@tanstack/table-core';
import type { OrganizationWithCounts } from './data.remote';
import { createRawSnippet } from 'svelte';
import { renderSnippet, renderComponent } from '$lib/components/ui/data-table/index.js';
import OrgDataTableActions from './org-data-table-actions.svelte';

export const orgColumns: ColumnDef<OrganizationWithCounts>[] = [
	{
		accessorKey: 'id',
		header: () => null,
		enableHiding: true,
		meta: {
			hidden: true
		},
		cell: () => null
	},
	{
		accessorKey: 'store_name',
		header: 'Store Name',
		cell: ({ row }) => {
			const nameSnippet = createRawSnippet<[{ storeName: string | null }]>((getData) => {
				const { storeName } = getData();
				return {
					render: () =>
						`<div class="font-medium">${storeName || '<span class="text-muted-foreground">N/A</span>'}</div>`
				};
			});
			return renderSnippet(nameSnippet, {
				storeName: row.original.store_name
			});
		}
	},
	{
		accessorKey: 'employee_count',
		header: 'Employees',
		cell: ({ row }) => {
			const countSnippet = createRawSnippet<[{ count: number }]>((getData) => {
				const { count } = getData();
				return {
					render: () =>
						`<div class="flex items-center gap-2">
							<span class="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300">
								${count}
							</span>
							<span class="text-sm text-muted-foreground">${count === 1 ? 'employee' : 'employees'}</span>
						</div>`
				};
			});
			return renderSnippet(countSnippet, {
				count: row.original.employee_count
			});
		}
	},
	{
		accessorKey: 'equipment_count',
		header: 'Equipment',
		cell: ({ row }) => {
			const countSnippet = createRawSnippet<[{ count: number }]>((getData) => {
				const { count } = getData();
				return {
					render: () =>
						`<div class="flex items-center gap-2">
							<span class="inline-flex items-center justify-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-300">
								${count}
							</span>
							<span class="text-sm text-muted-foreground">${count === 1 ? 'item' : 'items'}</span>
						</div>`
				};
			});
			return renderSnippet(countSnippet, {
				count: row.original.equipment_count
			});
		}
	},
	{
		accessorKey: 'phone',
		header: 'Phone',
		cell: ({ row }) => {
			const phoneSnippet = createRawSnippet<[{ phone: string | null }]>((getData) => {
				const { phone } = getData();
				return {
					render: () =>
						`<div class="text-sm">${phone || '<span class="text-muted-foreground">—</span>'}</div>`
				};
			});
			return renderSnippet(phoneSnippet, {
				phone: row.original.phone
			});
		}
	},
	{
		accessorKey: 'country',
		header: 'Country',
		cell: ({ row }) => {
			const countrySnippet = createRawSnippet<[{ country: string | null }]>((getData) => {
				const { country } = getData();
				return {
					render: () =>
						`<div class="text-sm">${country || '<span class="text-muted-foreground">—</span>'}</div>`
				};
			});
			return renderSnippet(countrySnippet, {
				country: row.original.country
			});
		}
	},
	{
		accessorKey: 'location',
		header: 'Location',
		cell: ({ row }) => {
			const locationSnippet = createRawSnippet<[{ location: string | null }]>((getData) => {
				const { location } = getData();
				return {
					render: () =>
						`<div class="text-sm max-w-[200px] truncate">${location || '<span class="text-muted-foreground">—</span>'}</div>`
				};
			});
			return renderSnippet(locationSnippet, {
				location: row.original.location
			});
		}
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => {
			const statusSnippet = createRawSnippet<[{ status: boolean | null }]>((getData) => {
				const { status } = getData();
				const isActive = status === true;
				const badgeClass = isActive
					? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
					: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
				const label = isActive ? 'Active' : 'Inactive';
				return {
					render: () =>
						`<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}">${label}</span>`
				};
			});
			return renderSnippet(statusSnippet, {
				status: row.original.status
			});
		}
	},
	{
		accessorKey: 'created_at',
		header: 'Created',
		cell: ({ row }) => {
			const dateSnippet = createRawSnippet<[{ createdAt: string }]>((getData) => {
				const { createdAt } = getData();
				const formatted = new Date(createdAt).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				});
				return {
					render: () => `<div class="text-sm text-muted-foreground">${formatted}</div>`
				};
			});
			return renderSnippet(dateSnippet, {
				createdAt: row.original.created_at
			});
		}
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => {
			return renderComponent(OrgDataTableActions, {
				id: row.original.id,
				storeName: row.original.store_name,
				email: row.original.email,
				phone: row.original.phone,
				country: row.original.country,
				location: row.original.location,
				status: row.original.status || false
			});
		}
	}
];
import type { ColumnDef } from '@tanstack/table-core';
import type { ExpenseWithClosing } from './data.remote';
import { createRawSnippet } from 'svelte';
import { renderSnippet, renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableHeader from '../data-table-header.svelte';
import ExpenseDataTableActions from './expense-data-table-actions.svelte';

export const expenseColumns: ColumnDef<ExpenseWithClosing>[] = [
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
		accessorKey: 'closing_id',
		header: () => null,
		enableHiding: true,
		meta: {
			hidden: true
		},
		cell: () => null
	},
	{
		accessorKey: 'closing_date',
		header: ({ column }) => {
			return renderComponent(DataTableHeader, {
				column: column as any,
				title: 'Date'
			});
		},
		cell: ({ row }) => {
			const dateSnippet = createRawSnippet<[{ closingDate: string }]>((getDate) => {
				const { closingDate } = getDate();
				const formatted = new Date(closingDate).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				});
				return {
					render: () => `<div class="font-medium">${formatted}</div>`
				};
			});
			return renderSnippet(dateSnippet, {
				closingDate: row.original.closing_date
			});
		}
	},
	{
		accessorKey: 'expense_category',
		header: 'Category',
		cell: ({ row }) => {
			const categorySnippet = createRawSnippet<[{ category: string | null }]>((getCategory) => {
				const { category } = getCategory();
				return {
					render: () => `<div class="font-medium">${category || 'Uncategorized'}</div>`
				};
			});
			return renderSnippet(categorySnippet, {
				category: row.original.expense_category
			});
		}
	},
	{
		accessorKey: 'description',
		header: 'Description',
		cell: ({ row }) => {
			const descSnippet = createRawSnippet<[{ description: string | null }]>((getDesc) => {
				const { description } = getDesc();
				return {
					render: () =>
						`<div class="text-sm text-muted-foreground max-w-xs truncate">${description || '—'}</div>`
				};
			});
			return renderSnippet(descSnippet, {
				description: row.original.description
			});
		}
	},
	{
		accessorKey: 'amount',
		header: ({ column }) => {
			return renderComponent(DataTableHeader, {
				column: column as any,
				title: 'Amount'
			});
		},
		cell: ({ row }) => {
			const amountSnippet = createRawSnippet<[{ amount: number }]>((getAmount) => {
				const { amount } = getAmount();
				const formatted = new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'EUR'
				}).format(amount);
				return {
					render: () => `<div class="font-semibold text-primary">${formatted}</div>`
				};
			});
			return renderSnippet(amountSnippet, {
				amount: row.original.amount || 0
			});
		}
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => {
			return renderComponent(ExpenseDataTableActions, {
				id: row.original.id,
				closingId: row.original.closing_id,
				category: row.original.expense_category,
				amount: row.original.amount
			});
		}
	}
];

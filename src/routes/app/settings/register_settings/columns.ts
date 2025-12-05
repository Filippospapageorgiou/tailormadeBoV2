import type { ColumnDef } from '@tanstack/table-core';
import type { DailyRegisterClosing } from '$lib/models/register.types';
import { createRawSnippet } from 'svelte';
import { renderSnippet } from '$lib/components/ui/data-table/index.js';
import RegisterDataTableActions from './register-data-table-actions.svelte';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableHeader from './data-table-header.svelte';

export const registerColumns: ColumnDef<DailyRegisterClosing>[] = [
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
		accessorKey: 'closing_date',
		header: ({ column }) => {
			return renderComponent(DataTableHeader, {
				column,
				title: 'Ημερομηνία'
			});
		},
		cell: ({ row }) => {
			const dateSnippet = createRawSnippet<[{ closingDate: string }]>((getDate) => {
				const { closingDate } = getDate();
				const formatted = new Date(closingDate).toLocaleDateString('el-GR', {
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
		accessorKey: 'total_sales',
		header: ({ column }) => {
			return renderComponent(DataTableHeader, {
				column,
				title: 'Σύνολο Πωλήσεων'
			});
		},
		cell: ({ row }) => {
			const salesSnippet = createRawSnippet<[{ totalSales: number }]>((getSales) => {
				const { totalSales } = getSales();
				const formatted = new Intl.NumberFormat('el-GR', {
					style: 'currency',
					currency: 'EUR'
				}).format(totalSales);
				return {
					render: () => `<div class="font-semibold text-green-600">${formatted}</div>`
				};
			});
			return renderSnippet(salesSnippet, {
				totalSales: row.original.total_sales || 0
			});
		}
	},
	{
		accessorKey: 'card_sales',
		header: 'Πωλήσεις Κάρτας',
		cell: ({ row }) => {
			const salesSnippet = createRawSnippet<[{ cardSales: number }]>((getSales) => {
				const { cardSales } = getSales();
				const formatted = new Intl.NumberFormat('el-GR', {
					style: 'currency',
					currency: 'EUR'
				}).format(cardSales);
				return {
					render: () => `<div class="text-sm">${formatted}</div>`
				};
			});
			return renderSnippet(salesSnippet, {
				cardSales: row.original.card_sales || 0
			});
		}
	},
	{
		accessorKey: 'cash_sales',
		header: 'Πωλήσεις Μετρητών',
		cell: ({ row }) => {
			const salesSnippet = createRawSnippet<[{ cashSales: number }]>((getSales) => {
				const { cashSales } = getSales();
				const formatted = new Intl.NumberFormat('el-GR', {
					style: 'currency',
					currency: 'EUR'
				}).format(cashSales);
				return {
					render: () => `<div class="text-sm">${formatted}</div>`
				};
			});
			return renderSnippet(salesSnippet, {
				cashSales: row.original.total_sales - row.original.card_sales || 0
			});
		}
	},
	{
		accessorKey: 'final_cash_balance',
		header: 'Αναμενόμενα Μετρητά',
		cell: ({ row }) => {
			const cashSnippet = createRawSnippet<[{ final_cash_balance: number }]>((getCash) => {
				const { final_cash_balance } = getCash();
				const formatted = new Intl.NumberFormat('el-GR', {
					style: 'currency',
					currency: 'EUR'
				}).format(final_cash_balance);
				return {
					render: () => `<div class="text-sm">${formatted}</div>`
				};
			});
			return renderSnippet(cashSnippet, {
				final_cash_balance: row.original.final_cash_balance || 0
			});
		}
	},
	{
		accessorKey: 'actual_cash_counted',
		header: 'Πραγματικά Μετρητά',
		cell: ({ row }) => {
			const cashSnippet = createRawSnippet<[{ actualCash: number }]>((getCash) => {
				const { actualCash } = getCash();
				const formatted = new Intl.NumberFormat('el-GR', {
					style: 'currency',
					currency: 'EUR'
				}).format(actualCash);
				return {
					render: () => `<div class="text-sm">${formatted}</div>`
				};
			});
			return renderSnippet(cashSnippet, {
				actualCash: row.original.actual_cash_counted || 0
			});
		}
	},
	{
		accessorKey: 'cash_diffrence',
		header: 'Διαφορά Μετρητών',
		cell: ({ row }) => {
			const diffSnippet = createRawSnippet<[{ difference: number }]>((getDiff) => {
				const { difference } = getDiff();
				const formatted = new Intl.NumberFormat('el-GR', {
					style: 'currency',
					currency: 'EUR'
				}).format(difference);
				const textColor = difference >= 0 ? '#10b981' : '#ef4444';
				return {
					render: () => `<div class="font-medium" style="color: ${textColor};">${formatted}</div>`
				};
			});
			return renderSnippet(diffSnippet, {
				difference: row.original.cash_diffrence || 0
			});
		}
	},
	{
		accessorKey: 'total_supplier_payments',
		header: 'Πληρωμές Προμηθευτών',
		cell: ({ row }) => {
			const paymentsSnippet = createRawSnippet<[{ payments: number }]>((getPayments) => {
				const { payments } = getPayments();
				const formatted = new Intl.NumberFormat('el-GR', {
					style: 'currency',
					currency: 'EUR'
				}).format(payments);
				return {
					render: () => `<div class="text-sm">${formatted}</div>`
				};
			});
			return renderSnippet(paymentsSnippet, {
				payments: row.original.total_supplier_payments || 0
			});
		}
	},
	{
		accessorKey: 'total_expenses',
		header: 'Έξοδα',
		cell: ({ row }) => {
			const expensesSnippet = createRawSnippet<[{ expenses: number }]>((getExpenses) => {
				const { expenses } = getExpenses();
				const formatted = new Intl.NumberFormat('el-GR', {
					style: 'currency',
					currency: 'EUR'
				}).format(expenses);
				return {
					render: () => `<div class="text-sm">${formatted}</div>`
				};
			});
			return renderSnippet(expensesSnippet, {
				expenses: row.original.total_expenses || 0
			});
		}
	},
	{
		id: 'actions',
		header: 'Ενέργειες',
		cell: ({ row }) => {
			return renderComponent(RegisterDataTableActions, {
				id: row.original.id,
				closingDate: row.original.closing_date,
				totalSales: row.original.total_sales,
				status: row.original.status
			});
		}
	}
];

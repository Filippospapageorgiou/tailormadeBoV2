import type { ColumnDef } from '@tanstack/table-core';
import type { DailyRegisterClosing } from '$lib/models/register.types';
import { createRawSnippet } from 'svelte';
import { renderSnippet } from '$lib/components/ui/data-table/index.js';
import RegisterDataTableActions from './register-data-table-actions.svelte';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableHeader from './data-table-header.svelte';

function formatEUR(value: number): string {
	return new Intl.NumberFormat('el-GR', {
		style: 'currency',
		currency: 'EUR'
	}).format(value);
}

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
				const date = new Date(closingDate);
				const day = date.toLocaleDateString('el-GR', { day: 'numeric' });
				const monthYear = date.toLocaleDateString('el-GR', {
					month: 'short',
					year: 'numeric'
				});
				return {
					render: () =>
						`<div class="flex flex-col">
							<span class="text-sm font-medium text-foreground">${day} ${monthYear}</span>
							<span class="text-xs text-muted-foreground">${date.toLocaleDateString('el-GR', { weekday: 'long' })}</span>
						</div>`
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
				const formatted = formatEUR(totalSales);
				return {
					render: () =>
						`<span class="text-sm font-semibold tabular-nums text-foreground">${formatted}</span>`
				};
			});
			return renderSnippet(salesSnippet, {
				totalSales: row.original.total_sales || 0
			});
		}
	},
	{
		accessorKey: 'card_sales',
		header: 'Κάρτες',
		cell: ({ row }) => {
			const salesSnippet = createRawSnippet<[{ cardSales: number }]>((getSales) => {
				const { cardSales } = getSales();
				const formatted = formatEUR(cardSales);
				return {
					render: () =>
						`<span class="text-sm tabular-nums text-muted-foreground">${formatted}</span>`
				};
			});
			return renderSnippet(salesSnippet, {
				cardSales: row.original.card_sales || 0
			});
		}
	},
	{
		accessorKey: 'cash_sales',
		header: 'Μετρητά',
		cell: ({ row }) => {
			const salesSnippet = createRawSnippet<[{ cashSales: number }]>((getSales) => {
				const { cashSales } = getSales();
				const formatted = formatEUR(cashSales);
				return {
					render: () =>
						`<span class="text-sm tabular-nums text-muted-foreground">${formatted}</span>`
				};
			});
			return renderSnippet(salesSnippet, {
				cashSales: row.original.total_sales - row.original.card_sales || 0
			});
		}
	},
	{
		accessorKey: 'final_cash_balance',
		header: 'Αναμενόμενα',
		cell: ({ row }) => {
			const cashSnippet = createRawSnippet<[{ final_cash_balance: number }]>((getCash) => {
				const { final_cash_balance } = getCash();
				const formatted = formatEUR(final_cash_balance);
				return {
					render: () =>
						`<span class="text-sm tabular-nums text-muted-foreground">${formatted}</span>`
				};
			});
			return renderSnippet(cashSnippet, {
				final_cash_balance: row.original.final_cash_balance || 0
			});
		}
	},
	{
		accessorKey: 'actual_cash_counted',
		header: 'Πραγματικά',
		cell: ({ row }) => {
			const cashSnippet = createRawSnippet<[{ actualCash: number }]>((getCash) => {
				const { actualCash } = getCash();
				const formatted = formatEUR(actualCash);
				return {
					render: () =>
						`<span class="text-sm tabular-nums text-muted-foreground">${formatted}</span>`
				};
			});
			return renderSnippet(cashSnippet, {
				actualCash: row.original.actual_cash_counted || 0
			});
		}
	},
	{
		accessorKey: 'cash_diffrence',
		header: 'Διαφορά',
		cell: ({ row }) => {
			const diffSnippet = createRawSnippet<[{ difference: number }]>((getDiff) => {
				const { difference } = getDiff();
				const formatted = formatEUR(Math.abs(difference));
				const isPositive = difference >= 0;
				const sign = difference > 0 ? '+' : difference < 0 ? '-' : '';
				// Use theme-aware classes instead of hardcoded hex colors
				const colorClass = difference === 0
					? 'text-muted-foreground'
					: isPositive
						? 'text-green-600 dark:text-green-400'
						: 'text-red-600 dark:text-red-400';
				const bgClass = difference === 0
					? ''
					: isPositive
						? 'bg-green-500/10 dark:bg-green-400/10'
						: 'bg-red-500/10 dark:bg-red-400/10';
				return {
					render: () =>
						`<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${colorClass} ${bgClass}">
							${sign}${formatted}
						</span>`
				};
			});
			return renderSnippet(diffSnippet, {
				difference: row.original.cash_diffrence || 0
			});
		}
	},
	{
		accessorKey: 'total_supplier_payments',
		header: 'Προμηθευτές',
		cell: ({ row }) => {
			const paymentsSnippet = createRawSnippet<[{ payments: number }]>((getPayments) => {
				const { payments } = getPayments();
				const formatted = formatEUR(payments);
				return {
					render: () =>
						`<span class="text-sm tabular-nums text-muted-foreground">${formatted}</span>`
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
				const formatted = formatEUR(expenses);
				return {
					render: () =>
						`<span class="text-sm tabular-nums text-muted-foreground">${formatted}</span>`
				};
			});
			return renderSnippet(expensesSnippet, {
				expenses: row.original.total_expenses || 0
			});
		}
	},
	{
		id: 'actions',
		header: '',
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

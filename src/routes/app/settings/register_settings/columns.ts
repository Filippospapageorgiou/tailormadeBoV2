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
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => {
			const statusSnippet = createRawSnippet<[{ status: string }]>((getStatus) => {
				const { status } = getStatus();
				const statusColors: Record<string, string> = {
					submitted: '#10b981',
					pending: '#f59e0b',
					approved: '#3b82f6',
					rejected: '#ef4444'
				};
				const bgColor = statusColors[status] || '#6b7280';
				const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

				return {
					render: () => `
  <span
    class="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 backdrop-blur-sm border border-white/10 text-white hover:opacity-90"
    style="
      background: linear-gradient(135deg, ${bgColor}99, ${bgColor}66);
      box-shadow: 0 2px 6px ${bgColor}26;
    "
  >
    ${capitalizedStatus}
  </span>
`
				};
			});
			return renderSnippet(statusSnippet, {
				status: row.original.status
			});
		}
	},
	{
		accessorKey: 'total_sales',
		header: ({ column }) => {
			return renderComponent(DataTableHeader, {
				column,
				title: 'Total Sales'
			});
		},
		cell: ({ row }) => {
			const salesSnippet = createRawSnippet<[{ totalSales: number }]>((getSales) => {
				const { totalSales } = getSales();
				const formatted = new Intl.NumberFormat('en-US', {
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
		header: 'Card Sales',
		cell: ({ row }) => {
			const salesSnippet = createRawSnippet<[{ cardSales: number }]>((getSales) => {
				const { cardSales } = getSales();
				const formatted = new Intl.NumberFormat('en-US', {
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
		accessorKey: 'final_cash_balance',
		header: 'Expected final Cash',
		cell: ({ row }) => {
			const cashSnippet = createRawSnippet<[{ final_cash_balance: number }]>((getCash) => {
				const { final_cash_balance } = getCash();
				const formatted = new Intl.NumberFormat('en-US', {
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
		header: 'Actual Cash',
		cell: ({ row }) => {
			const cashSnippet = createRawSnippet<[{ actualCash: number }]>((getCash) => {
				const { actualCash } = getCash();
				const formatted = new Intl.NumberFormat('en-US', {
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
		header: 'Cash Difference',
		cell: ({ row }) => {
			const diffSnippet = createRawSnippet<[{ difference: number }]>((getDiff) => {
				const { difference } = getDiff();
				const formatted = new Intl.NumberFormat('en-US', {
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
		header: 'Supplier Payments',
		cell: ({ row }) => {
			const paymentsSnippet = createRawSnippet<[{ payments: number }]>((getPayments) => {
				const { payments } = getPayments();
				const formatted = new Intl.NumberFormat('en-US', {
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
		header: 'Expenses',
		cell: ({ row }) => {
			const expensesSnippet = createRawSnippet<[{ expenses: number }]>((getExpenses) => {
				const { expenses } = getExpenses();
				const formatted = new Intl.NumberFormat('en-US', {
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
		header: 'Actions',
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

import type { ColumnDef } from '@tanstack/table-core';
import type { SupplierPaymentWithClosing } from './data.remote';
import { createRawSnippet } from 'svelte';
import { renderSnippet, renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableHeader from '../data-table-header.svelte';
import SupplierDataTableAction from './supplier-data-table-action.svelte';

export const supplierColumns: ColumnDef<SupplierPaymentWithClosing>[] = [
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
		accessorKey: 'supplier_name',
		header: 'Supplier',
		cell: ({ row }) => {
			const nameSnippet = createRawSnippet<[{ name: string | null }]>((getName) => {
				const { name } = getName();
				return {
					render: () => `<div class="font-medium">${name || 'N/A'}</div>`
				};
			});
			return renderSnippet(nameSnippet, {
				name: row.original.supplier_name
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
		accessorKey: 'payment_method',
		header: 'Payment Method',
		cell: ({ row }) => {
			const methodSnippet = createRawSnippet<[{ method: string | null }]>((getMethod) => {
				const { method } = getMethod();
				const formatted = method ? method.replace('_', ' ').toUpperCase() : 'N/A';
				return {
					render: () => `<div class="text-sm text-muted-foreground">${formatted}</div>`
				};
			});
			return renderSnippet(methodSnippet, {
				method: row.original.payment_method
			});
		}
	},
	{
		accessorKey: 'invoice_number',
		header: 'Invoice',
		cell: ({ row }) => {
			const invoiceSnippet = createRawSnippet<[{ invoice: string | null }]>((getInvoice) => {
				const { invoice } = getInvoice();
				return {
					render: () => `<div class="text-sm text-muted-foreground">${invoice || '—'}</div>`
				};
			});
			return renderSnippet(invoiceSnippet, {
				invoice: row.original.invoice_number
			});
		}
	},
	{
		accessorKey: 'notes',
		header: 'Notes',
		cell: ({ row }) => {
			const notesSnippet = createRawSnippet<[{ notes: string | null }]>((getNotes) => {
				const { notes } = getNotes();
				return {
					render: () =>
						`<div class="text-sm text-muted-foreground max-w-xs truncate">${notes || '—'}</div>`
				};
			});
			return renderSnippet(notesSnippet, {
				notes: row.original.notes
			});
		}
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => {
			return renderComponent(SupplierDataTableAction, {
				id: row.original.id,
				closingId: row.original.closing_id,
				supplierName: row.original.supplier_name,
				amount: row.original.amount
			});
		}
	}
];

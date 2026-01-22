import type { ColumnDef } from '@tanstack/table-core';
import type { BonusPeriod } from '$lib/models/bonus_organization.types';
import { createRawSnippet } from 'svelte';
import BonusPeriodsActions from './BonusPeriodsActions.svelte';
import BonusPeriodColumnHeader from './BonusPeriodColumnHeader.svelte';
import { renderSnippet, renderComponent } from '$lib/components/ui/data-table/index.js';

// Helper function for date formatting
const formatDate = (dateString: string, locale = 'el-GR'): string => {
	return new Date(dateString).toLocaleDateString(locale, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
};

// Quarter display helper
const formatQuarter = (quarter: 1 | 2 | 3 | 4): string => `Q${quarter}`;

// Status configuration for easy maintenance
const STATUS_CONFIG = {
	published: {
		label: 'Δημοσιευμένο',
		classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
	},
	draft: {
		label: 'Πρόχειρο',
		classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
	}
} as const;

// Helper for relative time
function getRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

	if (diffInDays === 0) return 'Σήμερα';
	if (diffInDays === 1) return 'Χθες';
	if (diffInDays < 7) return `${diffInDays} ημέρες πριν`;
	if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} εβδομάδες πριν`;
	if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} μήνες πριν`;
	return `${Math.floor(diffInDays / 365)} χρόνια πριν`;
}

// Columns that should be hidden (used for filtering only)
export const HIDDEN_COLUMNS = ['id', 'year', 'quarter'] as const;

// Export a function that creates columns with the refresh callback
export function createColumns(onRefresh?: () => Promise<void>): ColumnDef<BonusPeriod>[] {
	return [
		// Hidden ID column (hidden via columnVisibility state in table)
		{
			accessorKey: 'id',
			header: () => null,
			cell: () => null,
			enableHiding: true,
			enableSorting: false
		},

		// Year column (for filtering - hidden via columnVisibility state in table)
		{
			accessorKey: 'year',
			header: () => null,
			cell: () => null,
			enableHiding: true,
			enableSorting: false,
			filterFn: (row, id, value: string[]) => {
				if (!value || value.length === 0) return true;
				return value.includes(String(row.getValue(id)));
			}
		},

		// Quarter column (for filtering - hidden via columnVisibility state in table)
		{
			accessorKey: 'quarter',
			header: () => null,
			cell: () => null,
			enableHiding: true,
			enableSorting: false,
			filterFn: (row, id, value: string[]) => {
				if (!value || value.length === 0) return true;
				return value.includes(String(row.getValue(id)));
			}
		},

		// Combined Period column (Year + Quarter) - visible, sortable
		{
			id: 'period',
			header: ({ column }) => {
				return renderComponent(BonusPeriodColumnHeader, {
					column,
					title: 'Περίοδος'
				});
			},
			accessorFn: (row) => `${row.year}-Q${row.quarter}`,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ year: number; quarter: 1 | 2 | 3 | 4 }]>((getData) => {
					const { year, quarter } = getData();
					return {
						render: () => `
							<div class="flex flex-col">
								<span class="font-medium">${year}</span>
								<span class="text-xs text-muted-foreground">${formatQuarter(quarter)}</span>
							</div>
						`
					};
				});
				return renderSnippet(snippet, {
					year: row.original.year,
					quarter: row.original.quarter
				});
			},
			sortingFn: (rowA, rowB) => {
				const a = rowA.original.year * 10 + rowA.original.quarter;
				const b = rowB.original.year * 10 + rowB.original.quarter;
				return a - b;
			},
			enableSorting: true
		},

		// Comparison Period column
		{
			id: 'comparison_period',
			header: 'Σύγκριση με',
			accessorFn: (row) => `${row.comparison_year}-Q${row.comparison_quarter}`,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ year: number; quarter: 1 | 2 | 3 | 4 }]>((getData) => {
					const { year, quarter } = getData();
					return {
						render: () => `
							<div class="flex flex-col text-muted-foreground">
								<span>${year}</span>
								<span class="text-xs">${formatQuarter(quarter)}</span>
							</div>
						`
					};
				});
				return renderSnippet(snippet, {
					year: row.original.comparison_year,
					quarter: row.original.comparison_quarter
				});
			},
			enableSorting: false
		},

		// Network Average Percentage
		{
			accessorKey: 'network_average_percentage',
			header: ({ column }) => {
				return renderComponent(BonusPeriodColumnHeader, {
					column,
					title: 'Μ.Ο. Δικτύου'
				});
			},
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ percentage: number }]>((getData) => {
					const { percentage } = getData();
					const isPositive = percentage >= 0;
					const colorClass = isPositive
						? 'text-green-600 dark:text-green-400'
						: 'text-red-600 dark:text-red-400';
					const icon = isPositive ? '↑' : '↓';
					return {
						render: () => `
							<span class="font-mono font-medium ${colorClass}">
								${icon} ${Math.abs(percentage).toFixed(2)}%
							</span>
						`
					};
				});
				return renderSnippet(snippet, {
					percentage: row.original.network_average_percentage
				});
			},
			sortingFn: 'basic',
			enableSorting: true
		},

		// Status with badge
		{
			accessorKey: 'status',
			header: ({ column }) => {
				return renderComponent(BonusPeriodColumnHeader, {
					column,
					title: 'Κατάσταση'
				});
			},
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ status: BonusPeriod['status'] }]>((getData) => {
					const { status } = getData();
					const config = STATUS_CONFIG[status];
					return {
						render: () => `
							<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.classes}">
								<span class="h-1.5 w-1.5 rounded-full ${status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}"></span>
								${config.label}
							</span>
						`
					};
				});
				return renderSnippet(snippet, { status: row.original.status });
			},
			filterFn: (row, id, value: string[]) => {
				if (!value || value.length === 0) return true;
				return value.includes(row.getValue(id));
			},
			enableSorting: true
		},

		// Created date
		{
			accessorKey: 'created_at',
			header: ({ column }) => {
				return renderComponent(BonusPeriodColumnHeader, {
					column,
					title: 'Δημιουργήθηκε'
				});
			},
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ date: string }]>((getData) => {
					const { date } = getData();
					const formatted = formatDate(date);
					const relative = getRelativeTime(date);
					return {
						render: () => `
							<div class="flex flex-col">
								<span class="text-sm">${formatted}</span>
								<span class="text-xs text-muted-foreground">${relative}</span>
							</div>
						`
					};
				});
				return renderSnippet(snippet, { date: row.original.created_at });
			},
			sortingFn: 'datetime',
			enableSorting: true
		},

		// Published date (optional - shows when published)
		{
			accessorKey: 'published_at',
			header: ({ column }) => {
				return renderComponent(BonusPeriodColumnHeader, {
					column,
					title: 'Δημοσιεύθηκε'
				});
			},
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ date: string | null }]>((getData) => {
					const { date } = getData();
					if (!date) {
						return {
							render: () => `<span class="text-muted-foreground text-sm">—</span>`
						};
					}
					const formatted = formatDate(date);
					return {
						render: () => `<span class="text-sm">${formatted}</span>`
					};
				});
				return renderSnippet(snippet, { date: row.original.published_at });
			},
			sortingFn: (rowA, rowB) => {
				const a = rowA.original.published_at;
				const b = rowB.original.published_at;
				if (!a && !b) return 0;
				if (!a) return 1;
				if (!b) return -1;
				return new Date(a).getTime() - new Date(b).getTime();
			},
			enableSorting: true
		},

		// Actions
		{
			id: 'actions',
			header: () => null,
			enableHiding: false,
			enableSorting: false,
			cell: ({ row }) => {
				return renderComponent(BonusPeriodsActions, {
					bonusPeriod: row.original,
					onRefresh
				});
			}
		}
	];
}

// Also export a static version for backwards compatibility (without refresh)
export const columns = createColumns();
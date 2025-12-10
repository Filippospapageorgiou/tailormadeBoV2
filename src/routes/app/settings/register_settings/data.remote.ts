import { query, command, form, prerender } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import {
	getUserOrgId,
	getUserProfileWithRoleCheck,
	getDateRanges,
	getPreviousPeriodDates
} from '$lib/supabase/queries';
import type { DailyRegisterClosing } from '$lib/models/register.types';
import { z } from 'zod/v4';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RegisterSupplierPayment, RegisterExpense } from '$lib/models/register.types';

/**
 * Authenticated access check - verifies user has admin or manager role
 */
export const authenticatedAccess = query(async () => {
	const profile = await getUserProfileWithRoleCheck([1, 2]);
	return {
		success: true,
		profile
	};
});

const registerTableSchema = z.discriminatedUnion('mode', [
	z.object({
		mode: z.literal('period'),
		days: z.number().int().positive().default(30),
		start: z.number().int().positive().default(1),
		end: z.number().int().positive().default(10)
	}),
	z.object({
		mode: z.literal('range'),
		startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
		endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
		start: z.number().int().positive().default(1),
		end: z.number().int().positive().default(10)
	})
]);

// A schema similar to your table schema but without pagination params
const exportSchema = z.discriminatedUnion('mode', [
	z.object({
		mode: z.literal('period'),
		days: z.number().int().positive().default(30)
	}),
	z.object({
		mode: z.literal('range'),
		startDate: z.string(),
		endDate: z.string()
	})
]);

// Fetch ALL data for the period (No .range() call)
export const getRegisterDataForExport = query(exportSchema, async (params) => {
	const supabase = createServerClient();
	const org_id = await getUserOrgId();

	let currentStart: string;
	let currentEnd: string;

	if (params.mode === 'period') {
		const ranges = getDateRanges(params.days);
		currentStart = ranges.currentStart;
		currentEnd = ranges.currentEnd;
	} else {
		currentStart = params.startDate;
		currentEnd = params.endDate;
	}

	const { data, error } = await supabase
		.from('daily_register_closings')
		.select('*')
		.eq('org_id', org_id)
		.gte('closing_date', currentStart)
		.lte('closing_date', currentEnd)
		.order('closing_date', { ascending: false })
		.overrideTypes<DailyRegisterClosing[]>(); //

	if (error) {
		console.error('Export Fetch Error:', error);
		return { success: false, data: [] };
	}

	return { success: true, data: data || [] };
});

/**
 * Get register closing data by date range
 * Fetches current and previous period sales data for comparison
 */
export const getRegisterClosingByDateRange = query(registerTableSchema, async (params) => {
	const supabase = createServerClient();

	try {
		const org_id = await getUserOrgId();
		let currentStart: string;
		let currentEnd: string;
		let previousEnd: string;
		let previousStart: string;
		if (params.mode === 'period') {
			const ranges = getDateRanges(params.days);
			currentStart = ranges.currentStart;
			currentEnd = ranges.currentEnd;
			previousStart = ranges.previousStart;
			previousEnd = ranges.previousEnd;
		} else {
			// mode === 'range'
			currentStart = params.startDate;
			currentEnd = params.endDate;
			const previousDates = getPreviousPeriodDates(params.startDate, params.endDate);
			previousStart = previousDates.previousStart;
			previousEnd = previousDates.previousEnd;
		}

		// Fetch current period
		const { data: currentPeriod, error: currentError } = await supabase
			.from('daily_register_closings')
			.select('*')
			.eq('org_id', org_id)
			.gte('closing_date', currentStart)
			.lte('closing_date', currentEnd)
			.order('closing_date', { ascending: true })
			.overrideTypes<DailyRegisterClosing[]>();

		if (currentError) {
			console.error(
				'[getRegisterClosingByDateRange] Error fetching current period data:',
				currentError
			);
			return {
				success: false,
				message: 'Error fetching register data',
				currentPeriod: [],
				previousPeriod: [],
				totalSales: 0,
				previousTotalSales: 0,
				percentageChange: 0
			};
		}

		// Fetch previous period
		const { data: previousPeriod, error: previousError } = await supabase
			.from('daily_register_closings')
			.select('*')
			.eq('org_id', org_id)
			.gte('closing_date', previousStart)
			.lte('closing_date', previousEnd)
			.order('closing_date', { ascending: true })
			.overrideTypes<DailyRegisterClosing[]>();

		if (previousError) {
			console.error(
				'[getRegisterClosingByDateRange] Error fetching previous period data:',
				previousError
			);
			return {
				success: false,
				message: 'Error fetching previous period data',
				currentPeriod: currentPeriod || [],
				previousPeriod: [],
				totalSales: 0,
				previousTotalSales: 0,
				percentageChange: 0
			};
		}

		// Calculate totals
		const totalSales =
			currentPeriod?.reduce((sum, closing) => sum + (closing.total_sales || 0), 0) || 0;
		const previousTotalSales =
			previousPeriod?.reduce((sum, closing) => sum + (closing.total_sales || 0), 0) || 0;

		// Calculate percentage change
		let percentageChange = 0;
		if (previousTotalSales > 0) {
			percentageChange = ((totalSales - previousTotalSales) / previousTotalSales) * 100;
		} else if (totalSales > 0) {
			percentageChange = 100;
		}

		return {
			success: true,
			message: 'Successfully fetched register data',
			currentPeriod: currentPeriod || [],
			previousPeriod: previousPeriod || [],
			totalSales,
			previousTotalSales,
			percentageChange: Math.round(percentageChange * 100) / 100,
			currentStartDate: currentStart,
			currentEndDate: currentEnd,
			previousStartDate: previousStart,
			previousEndDate: previousEnd
		};
	} catch (err) {
		console.error('[getRegisterClosingByDateRange] Error:', err);
		return {
			success: false,
			message: 'Ένα σφάλμα παρουσιάστηκε κάτα την προσπάθεια λήψης δεδομένων',
			currentPeriod: [],
			previousPeriod: [],
			totalSales: 0,
			previousTotalSales: 0,
			percentageChange: 0
		};
	}
});

/**
 * Helper function to fetch supplier payments for a specific closing
 */
async function getPayments(
	supabase: SupabaseClient,
	id: number
): Promise<{ success: boolean; payments?: RegisterSupplierPayment[]; error?: string }> {
	try {
		const { data, error: queryError } = await supabase
			.from('register_supplier_payments')
			.select('*')
			.eq('closing_id', id)
			.overrideTypes<RegisterSupplierPayment[]>();

		if (queryError) {
			console.error(`[getPayments] Error getting payments for closing_id ${id}:`, queryError);
			return { success: false, error: 'Failed to get payments' };
		}

		return { success: true, payments: data };
	} catch (err) {
		console.error(`[getPayments] Unexpected error:`, err);
		return { success: false, error: 'Unexpected error getting payments' };
	}
}

/**
 * Get supplier payment data by date range
 * Aggregates all supplier payments and calculates totals by supplier
 */
export const getSuppliersDataPayments = query(registerTableSchema, async (params) => {
	const supabase = createServerClient();

	try {
		const org_id = await getUserOrgId();
		let currentStart: string;
		let currentEnd: string;
		if (params.mode === 'period') {
			const ranges = getDateRanges(params.days);
			currentStart = ranges.currentStart;
			currentEnd = ranges.currentEnd;
		} else {
			// mode === 'range'
			currentStart = params.startDate;
			currentEnd = params.endDate;
		}

		// Fetch current period register closings
		const { data: currentPeriod, error: currentError } = await supabase
			.from('daily_register_closings')
			.select('*')
			.eq('org_id', org_id)
			.gte('closing_date', currentStart)
			.lte('closing_date', currentEnd)
			.order('closing_date', { ascending: true })
			.overrideTypes<DailyRegisterClosing[]>();

		if (currentError) {
			console.error('[getSuppliersDataPayments] Error fetching current period data:', currentError);
			return {
				success: false,
				message: 'Error fetching register data',
				currentStartDate: currentStart,
				currentEndDate: currentEnd,
				totalSupplierPayments: 0,
				supplierPayments: [],
				supplierTotals: [],
				countSuppliers: 0
			};
		}

		const ids = currentPeriod.map((r) => r.id);

		// Collect all payments from all closings
		const allPayments: RegisterSupplierPayment[] = [];
		for (const id of ids) {
			const result = await getPayments(supabase, id);
			if (result.success && result.payments) {
				allPayments.push(...result.payments);
			}
		}

		// Create supplier totals map - aggregate by supplier_name
		const supplierMap = new Map<string, number>();
		allPayments.forEach((payment) => {
			const currentTotal = supplierMap.get(payment.supplier_name!) || 0;
			supplierMap.set(payment.supplier_name!, currentTotal + payment.amount);
		});

		// Convert map to array of objects and round to 2 decimals
		const supplierTotals = Array.from(supplierMap, ([supplier_name, total]) => ({
			supplier_name,
			total: Math.round(total * 100) / 100
		}))
			.sort((a, b) => b.total - a.total) // Sort by total descending (highest first)
			.slice(0, 10); // Limit to 10 suppliers

		const countSuppliers = supplierTotals.length;

		// Calculate total supplier payments
		const totalSupplierPayments = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

		return {
			success: true,
			message: 'Successfully fetched supplier payments data',
			currentStartDate: currentStart,
			currentEndDate: currentEnd,
			totalSupplierPayments: Math.round(totalSupplierPayments * 100) / 100,
			supplierPayments: allPayments,
			supplierTotals,
			countSuppliers
		};
	} catch (err) {
		console.error('[getSuppliersDataPayments] Error:', err);
		return {
			success: false,
			message: 'Ένα σφάλμα παρουσιάστηκε κάτα την προσπάθεια λήψης δεδομένων',
			currentStartDate: null,
			currentEndDate: null,
			totalSupplierPayments: 0,
			supplierPayments: [],
			supplierTotals: [],
			countSuppliers: 0
		};
	}
});

/**
 * Helper function to fetch expenses for a specific closing
 */
async function getExpenses(
	supabase: SupabaseClient,
	id: number
): Promise<{ success: boolean; expenses?: RegisterExpense[]; error?: string }> {
	try {
		const { data, error: queryError } = await supabase
			.from('register_expenses')
			.select('*')
			.eq('closing_id', id)
			.overrideTypes<RegisterExpense[]>();

		if (queryError) {
			console.error(`[getExpenses] Error getting expenses for closing_id ${id}:`, queryError);
			return { success: false, error: 'Failed to get expenses' };
		}

		return { success: true, expenses: data };
	} catch (err) {
		console.error(`[getExpenses] Unexpected error:`, err);
		return { success: false, error: 'Unexpected error getting expenses' };
	}
}

/**
 * Get expenses data by date range
 * Fetches all expenses for the specified period and calculates totals
 */
export const getExpensesData = query(registerTableSchema, async (params) => {
	const supabase = createServerClient();

	try {
		const org_id = await getUserOrgId();

		let currentStart: string;
		let currentEnd: string;
		if (params.mode === 'period') {
			const ranges = getDateRanges(params.days);
			currentStart = ranges.currentStart;
			currentEnd = ranges.currentEnd;
		} else {
			// mode === 'range'
			currentStart = params.startDate;
			currentEnd = params.endDate;
		}

		// Fetch current period register closings
		const { data: currentPeriod, error: currentError } = await supabase
			.from('daily_register_closings')
			.select('*')
			.eq('org_id', org_id)
			.gte('closing_date', currentStart)
			.lte('closing_date', currentEnd)
			.order('closing_date', { ascending: true })
			.overrideTypes<DailyRegisterClosing[]>();

		if (currentError) {
			console.error('[getExpensesData] Error fetching current period data:', currentError);
			return {
				success: false,
				message: 'Error fetching register data',
				currentStartDate: currentStart,
				currentEndDate: currentEnd,
				totalExpenses: 0,
				expensesList: [],
				expenseTotals: [],
				countExpenseCategories: 0
			};
		}

		const ids = currentPeriod.map((r) => r.id);

		// Collect all expenses from all closings
		const allExpenses: RegisterExpense[] = [];
		for (const id of ids) {
			const result = await getExpenses(supabase, id);
			if (result.success && result.expenses) {
				allExpenses.push(...result.expenses);
			}
		}

		// Calculate total expenses
		const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);

		return {
			success: true,
			message: 'Successfully fetched expenses data',
			currentStartDate: currentStart,
			currentEndDate: currentEnd,
			totalExpenses: Math.round(totalExpenses * 100) / 100,
			expensesList: allExpenses,
			expenseTotals: [],
			countExpenseCategories: 0
		};
	} catch (err) {
		console.error('[getExpensesData] Error:', err);
		return {
			success: false,
			message: 'Ένα σφάλμα παρουσιάστηκε κάτα την προσπάθεια λήψης δεδομένων',
			currentStartDate: null,
			currentEndDate: null,
			totalExpenses: 0,
			expensesList: [],
			expenseTotals: [],
			countExpenseCategories: 0
		};
	}
});

export const getRegisterDataTable = query(registerTableSchema, async (params) => {
	const supabase = createServerClient();

	try {
		const org_id = await getUserOrgId();

		let currentStart: string;
		let currentEnd: string;

		if (params.mode === 'period') {
			const ranges = getDateRanges(params.days);
			currentStart = ranges.currentStart;
			currentEnd = ranges.currentEnd;
		} else {
			// mode === 'range'
			currentStart = params.startDate;
			currentEnd = params.endDate;
		}

		// Fetch current period with pagination
		const {
			data: registerData,
			error: dataError,
			count
		} = await supabase
			.from('daily_register_closings')
			.select('*', { count: 'exact' })
			.eq('org_id', org_id)
			.gte('closing_date', currentStart)
			.lte('closing_date', currentEnd)
			.order('closing_date', { ascending: false })
			.range(params.start - 1, params.end - 1)
			.overrideTypes<DailyRegisterClosing[]>();

		if (dataError) {
			console.error('[getRegisterDataTable] Error fetching register data:', dataError);
			return {
				success: false,
				message: 'Error fetching register table data',
				data: [],
				totalCount: 0,
				pageStart: params.start,
				pageEnd: params.end
			};
		}
		return {
			success: true,
			message: 'Successfully fetched register table data',
			data: registerData || [],
			totalCount: count || 0,
			pageStart: params.start,
			pageEnd: params.end,
			currentStartDate: currentStart,
			currentEndDate: currentEnd
		};
	} catch (err) {
		console.error('[getRegisterDataTable] Error:', err);
		return {
			success: false,
			message: 'Ένα σφάλμα παρουσιάστηκε κάτα την προσπάθεια λήψης δεδομένων',
			data: [],
			totalCount: 0,
			pageStart: params.start,
			pageEnd: params.end
		};
	}
});

const deleteRegisterClosingSchema = z.object({
	closingId: z.number().int().positive({ error: 'Closing ID must be a positive integer' })
});

/**
 * Delete a register closing record
 */
export const deleteRegisterClosing = command(deleteRegisterClosingSchema, async ({ closingId }) => {
	const supabase = createServerClient();

	try {
		const { error } = await supabase.from('daily_register_closings').delete().eq('id', closingId);

		if (error) {
			console.error('[deleteRegisterClosing] Error deleting register closing:', error);
			return {
				success: false,
				message: 'Failed to delete register closing'
			};
		}

		return {
			success: true,
			message: 'Register closing deleted successfully'
		};
	} catch (err) {
		console.error('[deleteRegisterClosing] Unexpected error:', err);
		return {
			success: false,
			message: 'An unexpected error occurred while deleting register closing'
		};
	}
});

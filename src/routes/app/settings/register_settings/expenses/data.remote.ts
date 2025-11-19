import { query } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { getUserOrgId, getDateRanges } from '$lib/supabase/queries';
import type { DailyRegisterClosing, RegisterExpense } from '$lib/models/register.types';
import { z } from 'zod/v4';

const expenseTableSchema = z.discriminatedUnion('mode', [
	z.object({
		mode: z.literal('period'),
		days: z.number().int().positive().default(30)
	}),
	z.object({
		mode: z.literal('range'),
		startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
		endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
	})
]);

export interface ExpenseWithClosing extends RegisterExpense {
	closing_date: string;
}

/**
 * Get expenses data for the table
 */
export const getExpensesTable = query(expenseTableSchema, async (params) => {
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
			currentStart = params.startDate;
			currentEnd = params.endDate;
		}

		// Fetch register closings for the period
		const { data: closings, error: closingsError } = await supabase
			.from('daily_register_closings')
			.select('id, closing_date')
			.eq('org_id', org_id)
			.gte('closing_date', currentStart)
			.lte('closing_date', currentEnd)
			.order('closing_date', { ascending: false });

		if (closingsError) {
			console.error('[getExpensesTable] Error fetching closings:', closingsError);
			return {
				success: false,
				message: 'Error fetching register closings',
				data: [],
				currentStartDate: currentStart,
				currentEndDate: currentEnd
			};
		}

		if (!closings || closings.length === 0) {
			return {
				success: true,
				message: 'No register closings found for this period',
				data: [],
				currentStartDate: currentStart,
				currentEndDate: currentEnd
			};
		}

		const closingIds = closings.map((c) => c.id);
		const closingDateMap = new Map(closings.map((c) => [c.id, c.closing_date]));

		// Fetch all expenses for these closings
		const { data: expenses, error: expensesError } = await supabase
			.from('register_expenses')
			.select('*')
			.in('closing_id', closingIds)
			.order('created_at', { ascending: false });

		if (expensesError) {
			console.error('[getExpensesTable] Error fetching expenses:', expensesError);
			return {
				success: false,
				message: 'Error fetching expenses',
				data: [],
				currentStartDate: currentStart,
				currentEndDate: currentEnd
			};
		}

		// Add closing_date to each expense
		const expensesWithDate: ExpenseWithClosing[] = (expenses || []).map((expense) => ({
			...expense,
			closing_date: closingDateMap.get(expense.closing_id) || ''
		}));

		return {
			success: true,
			message: 'Successfully fetched expenses',
			data: expensesWithDate,
			currentStartDate: currentStart,
			currentEndDate: currentEnd
		};
	} catch (err) {
		console.error('[getExpensesTable] Error:', err);
		return {
			success: false,
			message: 'An error occurred while fetching expenses',
			data: [],
			currentStartDate: null,
			currentEndDate: null
		};
	}
});

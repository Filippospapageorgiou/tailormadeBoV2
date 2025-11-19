import { query } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { getUserOrgId, getDateRanges } from '$lib/supabase/queries';
import type { DailyRegisterClosing, RegisterSupplierPayment } from '$lib/models/register.types';
import { z } from 'zod/v4';

const supplierTableSchema = z.discriminatedUnion('mode', [
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

export interface SupplierPaymentWithClosing extends RegisterSupplierPayment {
	closing_date: string;
}

/**
 * Get supplier payments data for the table
 */
export const getSupplierPaymentsTable = query(supplierTableSchema, async (params) => {
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
			console.error('[getSupplierPaymentsTable] Error fetching closings:', closingsError);
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

		// Fetch all supplier payments for these closings
		const { data: payments, error: paymentsError } = await supabase
			.from('register_supplier_payments')
			.select('*')
			.in('closing_id', closingIds)
			.order('created_at', { ascending: false });

		if (paymentsError) {
			console.error('[getSupplierPaymentsTable] Error fetching payments:', paymentsError);
			return {
				success: false,
				message: 'Error fetching supplier payments',
				data: [],
				currentStartDate: currentStart,
				currentEndDate: currentEnd
			};
		}

		const total = payments.reduce((sum, payment) => sum + payment.amount, 0);

		// Add closing_date to each payment
		const paymentsWithDate: SupplierPaymentWithClosing[] = (payments || []).map((payment) => ({
			...payment,
			closing_date: closingDateMap.get(payment.closing_id) || ''
		}));

		return {
			success: true,
			message: 'Successfully fetched supplier payments',
			data: paymentsWithDate,
			currentStartDate: currentStart,
			currentEndDate: currentEnd,
			total
		};
	} catch (err) {
		console.error('[getSupplierPaymentsTable] Error:', err);
		return {
			success: false,
			message: 'An error occurred while fetching supplier payments',
			data: [],
			currentStartDate: null,
			currentEndDate: null
		};
	}
});

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import ExcelJS from 'exceljs';
import { getRegisterDataForExport } from '../../data.remote';
import { getProfileByUUId } from '$lib/supabase/queries';

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.json();

	// 1. Fetch Data
	const result = await getRegisterDataForExport(payload);

	if (!result.success || !result.data) {
		return json({ error: 'Failed to fetch data' }, { status: 500 });
	}

	const data = result.data;

	// 2. Create Workbook
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Register Closings');

	// 3. Define Columns (Mapped to your Interface)
	worksheet.columns = [
		// Βασικά Στοιχεία (Basic Info)
		{ header: 'ID', key: 'id', width: 8 },
		{ header: 'Ημερομηνία', key: 'closing_date', width: 12 }, // Date
		{ header: 'Κατάσταση', key: 'status', width: 12 }, // Status

		// Ανάλυση Πωλήσεων (Sales Breakdown)
		{ header: 'Σύνολο Πωλήσεων', key: 'total_sales', width: 15, style: { numFmt: '"€"#,##0.00' } }, // Total Sales
		{
			header: 'Μετρητά (Πωλήσεις)',
			key: 'excepted_cash',
			width: 15,
			style: { numFmt: '"€"#,##0.00' }
		}, // Cash Sales
		{ header: 'Πωλήσεις Κάρτας', key: 'card_sales', width: 15, style: { numFmt: '"€"#,##0.00' } }, // Card Sales
		// Διαχείριση Μετρητών (Cash Handling)
		{ header: 'Αρχικό Ταμείο', key: 'opening_float', width: 15, style: { numFmt: '"€"#,##0.00' } }, // Opening Float
		{
			header: 'Αναμενόμενα',
			key: 'final_cash_balance',
			width: 15,
			style: { numFmt: '"€"#,##0.00' }
		}, // Expected Final
		{
			header: 'Καταμέτρηση',
			key: 'actual_cash_counted',
			width: 15,
			style: { numFmt: '"€"#,##0.00' }
		}, // Actual Cash
		{ header: 'Διαφορά', key: 'cash_diffrence', width: 12, style: { numFmt: '"€"#,##0.00' } }, // Difference
		{ header: 'Κατάθεση', key: 'cash_deposit', width: 12, style: { numFmt: '"€"#,##0.00' } }, // Deposit
		{
			header: 'Ταμείο Επόμενης',
			key: 'tomorrow_opening_float',
			width: 16,
			style: { numFmt: '"€"#,##0.00' }
		}, // Tomorrow Float

		// Εκροές (Outflows)
		{
			header: 'Πληρωμές Προμ.',
			key: 'total_supplier_payments',
			width: 16,
			style: { numFmt: '"€"#,##0.00' }
		}, // Supplier Payments
		{ header: 'Έξοδα', key: 'total_expenses', width: 12, style: { numFmt: '"€"#,##0.00' } }, // Expenses

		// Μεταδεδομένα (Metadata)
		{ header: 'Κλείσιμο Από', key: 'closed_by', width: 30 }, // Closed By
		{ header: 'Σημειώσεις', key: 'notes', width: 30 } // Notes
	];

	// 4. Style Header
	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFE0E0E0' }
	};

	for (const item of data) {
		// Fetch the profile first (assuming getProfileByUUId returns a name or object)
		const profileName = await getProfileByUUId(item.closed_by);

		worksheet.addRow({
			closing_date: new Date(item.closing_date),
			status: item.status,

			// Sales
			total_sales: item.total_sales,
			excepted_cash: item.excepted_cash,
			card_sales: item.card_sales,

			// Cash Handling
			opening_float: item.opening_float,
			final_cash_balance: item.final_cash_balance,
			actual_cash_counted: item.actual_cash_counted,
			cash_diffrence: item.cash_diffrence,
			cash_deposit: item.cash_deposit,
			tomorrow_opening_float: item.tomorrow_opening_float,

			// Outflows
			total_supplier_payments: item.total_supplier_payments,
			total_expenses: item.total_expenses,

			// Metadata
			closed_by: profileName, // Use the fetched value
			notes: item.notes
		});
	}

	// 6. Generate Buffer
	const buffer = await workbook.xlsx.writeBuffer();

	// 7. Return Stream
	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="register_report_${new Date().toISOString().split('T')[0]}.xlsx"`
		}
	});
};

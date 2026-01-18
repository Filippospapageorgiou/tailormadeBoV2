import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import ExcelJS from 'exceljs';
import { getRegisterDataForExport } from '../../data.remote';
import { getProfileByUUId } from '$lib/supabase/queries';

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.json();

	const result = await getRegisterDataForExport(payload);

	if (!result.success || !result.data) {
		return json({ error: 'Failed to fetch data' }, { status: 500 });
	}

	const data = result.data;

	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'Register System';
	workbook.created = new Date();

	const worksheet = workbook.addWorksheet('Register Closings', {
		views: [{ state: 'frozen', ySplit: 5 }] // Freeze header rows
	});

	// ============================================
	// TITLE SECTION
	// ============================================
	worksheet.mergeCells('A1:P1');
	const titleCell = worksheet.getCell('A1');
	titleCell.value = 'ΑΝΑΦΟΡΑ ΚΛΕΙΣΙΜΑΤΟΣ ΤΑΜΕΙΟΥ';
	titleCell.font = { bold: true, size: 18, color: { argb: 'FF2D3748' } };
	titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
	worksheet.getRow(1).height = 35;

	// Subtitle with date range
	worksheet.mergeCells('A2:P2');
	const subtitleCell = worksheet.getCell('A2');
	subtitleCell.value = `Ημερομηνία Εξαγωγής: ${new Date().toLocaleDateString('el-GR')}`;
	subtitleCell.font = { italic: true, size: 11, color: { argb: 'FF718096' } };
	subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
	worksheet.getRow(2).height = 20;

	// Empty row for spacing
	worksheet.getRow(3).height = 10;

	// ============================================
	// COLUMN HEADERS WITH GROUPING
	// ============================================

	// Group headers (Row 4)
	const groupHeaderRow = worksheet.getRow(4);
	groupHeaderRow.height = 25;

	// Merge cells for group headers
	worksheet.mergeCells('A4:C4'); // Βασικά Στοιχεία
	worksheet.mergeCells('D4:F4'); // Πωλήσεις
	worksheet.mergeCells('G4:L4'); // Διαχείριση Μετρητών
	worksheet.mergeCells('M4:N4'); // Εκροές
	worksheet.mergeCells('O4:P4'); // Πληροφορίες

	const groupHeaders = [
		{ cell: 'A4', value: '📋 ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ', color: 'FF4A5568' },
		{ cell: 'D4', value: '💰 ΠΩΛΗΣΕΙΣ', color: 'FF2B6CB0' },
		{ cell: 'G4', value: '🏦 ΔΙΑΧΕΙΡΙΣΗ ΜΕΤΡΗΤΩΝ', color: 'FF2F855A' },
		{ cell: 'M4', value: '📤 ΕΚΡΟΕΣ', color: 'FFC53030' },
		{ cell: 'O4', value: '📝 ΠΛΗΡΟΦΟΡΙΕΣ', color: 'FF6B46C1' }
	];

	groupHeaders.forEach(({ cell, value, color }) => {
		const c = worksheet.getCell(cell);
		c.value = value;
		c.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
		c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
		c.alignment = { horizontal: 'center', vertical: 'middle' };
	});

	// ============================================
	// COLUMN DEFINITIONS (Row 5)
	// ============================================
	worksheet.columns = [
		// Βασικά Στοιχεία (Basic Info)
		{ key: 'id', width: 8 },
		{ key: 'closing_date', width: 14 },
		{ key: 'status', width: 12 },

		// Πωλήσεις (Sales)
		{ key: 'total_sales', width: 16 },
		{ key: 'card_sales', width: 16 },
		{ key: 'cash_sales', width: 16 },

		// Διαχείριση Μετρητών (Cash Handling)
		{ key: 'opening_float', width: 16 },
		{ key: 'final_cash_balance', width: 16 },
		{ key: 'actual_cash_counted', width: 16 },
		{ key: 'cash_diffrence', width: 14 },
		{ key: 'cash_deposit', width: 14 },
		{ key: 'tomorrow_opening_float', width: 16 },

		// Εκροές (Outflows)
		{ key: 'total_supplier_payments', width: 16 },
		{ key: 'total_expenses', width: 14 },

		// Metadata
		{ key: 'closed_by', width: 25 },
		{ key: 'notes', width: 35 }
	];

	// Sub-headers (Row 5)
	const subHeaders = [
		'ID',
		'Ημερομηνία',
		'Κατάσταση',
		'Σύνολο Πωλήσεων',
		'Πωλήσεις Κάρτας',
		'Πωλήσεις Μετρήτων',
		'Αρχικό Ταμείο',
		'Αναμενόμενα',
		'Καταμέτρηση',
		'Διαφορά',
		'Κατάθεση',
		'Ταμείο Επόμενης',
		'Πληρωμές Προμ.',
		'Έξοδα',
		'Κλείσιμο Από',
		'Σημειώσεις'
	];

	const subHeaderRow = worksheet.getRow(5);
	subHeaders.forEach((header, index) => {
		const cell = subHeaderRow.getCell(index + 1);
		cell.value = header;
		cell.font = { bold: true, size: 10, color: { argb: 'FF2D3748' } };
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
		cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
		cell.border = {
			bottom: { style: 'medium', color: { argb: 'FFCBD5E0' } }
		};
	});
	subHeaderRow.height = 30;

	// ============================================
	// DATA ROWS
	// ============================================
	let rowIndex = 6;

	for (const item of data) {
		const profileName = await getProfileByUUId(item.closed_by);
		const cashSales = (item.total_sales || 0) - (item.card_sales || 0);

		const row = worksheet.addRow({
			id: item.id,
			closing_date: new Date(item.closing_date),
			status: item.status,
			total_sales: item.total_sales || 0,
			card_sales: item.card_sales || 0,
			cash_sales: cashSales,
			opening_float: item.opening_float || 0,
			final_cash_balance: item.final_cash_balance || 0,
			actual_cash_counted: item.actual_cash_counted || 0,
			cash_diffrence: item.cash_diffrence || 0,
			cash_deposit: item.cash_deposit || 0,
			tomorrow_opening_float: item.tomorrow_opening_float || 0,
			total_supplier_payments: item.total_supplier_payments || 0,
			total_expenses: item.total_expenses || 0,
			closed_by: profileName,
			notes: item.notes || ''
		});

		// Style the data row
		row.height = 22;
		row.eachCell((cell, colNumber) => {
			cell.alignment = { horizontal: 'center', vertical: 'middle' };

			// Alternate row colors
			if (rowIndex % 2 === 0) {
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FAFC' } };
			}

			// Currency formatting for money columns (4-14)
			if (colNumber >= 4 && colNumber <= 14) {
				cell.numFmt = '#,##0.00 €';
			}

			// Date formatting
			if (colNumber === 2) {
				cell.numFmt = 'DD/MM/YYYY';
			}

			// Status styling
			if (colNumber === 3) {
				const status = cell.value?.toString().toLowerCase();
				if (status === 'completed' || status === 'ολοκληρώθηκε') {
					cell.font = { color: { argb: 'FF2F855A' }, bold: true };
				} else if (status === 'pending' || status === 'εκκρεμεί') {
					cell.font = { color: { argb: 'FFDD6B20' }, bold: true };
				}
			}

			// Cash difference styling (red if negative, green if positive)
			if (colNumber === 10) {
				const diff = Number(cell.value) || 0;
				if (diff < 0) {
					cell.font = { color: { argb: 'FFC53030' }, bold: true };
				} else if (diff > 0) {
					cell.font = { color: { argb: 'FF2F855A' }, bold: true };
				}
			}

			// Light borders
			cell.border = {
				bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
			};
		});

		rowIndex++;
	}

	// ============================================
	// SUMMARY ROW
	// ============================================
	const summaryRowIndex = rowIndex + 1;
	worksheet.getRow(rowIndex).height = 10; // Spacing

	const summaryRow = worksheet.getRow(summaryRowIndex);
	summaryRow.height = 28;

	// Calculate totals
	const totals = data.reduce(
		(acc, item) => {
			acc.total_sales += item.total_sales || 0;
			acc.card_sales += item.card_sales || 0;
			acc.cash_sales += (item.total_sales || 0) - (item.card_sales || 0);
			acc.total_supplier_payments += item.total_supplier_payments || 0;
			acc.total_expenses += item.total_expenses || 0;
			acc.cash_deposit += item.cash_deposit || 0;
			return acc;
		},
		{
			total_sales: 0,
			card_sales: 0,
			cash_sales: 0,
			total_supplier_payments: 0,
			total_expenses: 0,
			cash_deposit: 0
		}
	);

	worksheet.mergeCells(`A${summaryRowIndex}:C${summaryRowIndex}`);
	const summaryLabelCell = worksheet.getCell(`A${summaryRowIndex}`);
	summaryLabelCell.value = '📊 ΣΥΝΟΛΑ';
	summaryLabelCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
	summaryLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
	summaryLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };

	const summaryValues = [
		{ col: 4, value: totals.total_sales },
		{ col: 5, value: totals.card_sales },
		{ col: 6, value: totals.cash_sales },
		{ col: 11, value: totals.cash_deposit },
		{ col: 13, value: totals.total_supplier_payments },
		{ col: 14, value: totals.total_expenses }
	];

	summaryValues.forEach(({ col, value }) => {
		const cell = summaryRow.getCell(col);
		cell.value = value;
		cell.numFmt = '#,##0.00 €';
		cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
		cell.alignment = { horizontal: 'center', vertical: 'middle' };
	});

	// Fill remaining summary cells with dark background
	for (let col = 1; col <= 16; col++) {
		const cell = summaryRow.getCell(col);
		if (!cell.value && col > 3) {
			cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
		}
	}

	// ============================================
	// GENERATE & RETURN
	// ============================================
	const buffer = await workbook.xlsx.writeBuffer();

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="register_report_${new Date().toISOString().split('T')[0]}.xlsx"`
		}
	});
};
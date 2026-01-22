import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import ExcelJS from 'exceljs';
import { createServerClient } from '$lib/supabase/server';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';

export const POST: RequestHandler = async ({ request, params }) => {
	const supabase = createServerClient();

	try {
		// Auth check
		await getUserProfileWithRoleCheck([1]);

		const periodId = Number(params.id);

		if (!periodId || isNaN(periodId)) {
			return json({ error: 'Invalid period ID' }, { status: 400 });
		}

		// Get period info
		const { data: period, error: periodError } = await supabase
			.from('bonus_periods')
			.select('*')
			.eq('id', periodId)
			.single();

		if (periodError || !period) {
			return json({ error: 'Period not found' }, { status: 404 });
		}

		// Get organization data with org names (without leaderboard - fetch separately)
		const { data: orgData, error: orgError } = await supabase
			.from('bonus_organization_data')
			.select(`
				*,
				core_organizations(store_name)
			`)
			.eq('period_id', periodId)
			.order('percentage_change', { ascending: false });

		if (orgError) {
			console.error('[getBonusPeriodDetails] Org data error:', orgError);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση δεδομένων οργανισμών'
			};
		}

		// Get leaderboard cache separately
		const { data: leaderboardData, error: leaderboardError } = await supabase
			.from('bonus_leaderboard_cache')
			.select('org_id, rank')
			.eq('period_id', periodId);

		if (leaderboardError) {
			console.error('[getBonusPeriodDetails] Leaderboard error:', leaderboardError);
			// Don't fail - just continue without ranks
		}

		// Create a map of org_id -> rank
		const rankMap = new Map<number, number>();
		leaderboardData?.forEach((item) => {
			rankMap.set(item.org_id, item.rank);
		});

		// Flatten the data and add ranks
		const organizations = orgData?.map((org) => ({
			...org,
			org_name: org.core_organizations?.store_name || `Org #${org.org_id}`,
			rank: rankMap.get(org.org_id) || null
		})) || [];


		// ============================================
		// CREATE WORKBOOK
		// ============================================
		const workbook = new ExcelJS.Workbook();
		workbook.creator = 'Bonus Management System';
		workbook.created = new Date();

		const worksheet = workbook.addWorksheet(`Q${period.quarter} ${period.year}`, {
			views: [{ state: 'frozen', ySplit: 5 }]
		});

		// ============================================
		// TITLE SECTION
		// ============================================
		worksheet.mergeCells('A1:L1');
		const titleCell = worksheet.getCell('A1');
		titleCell.value = `ΑΝΑΦΟΡΑ BONUS - Q${period.quarter} ${period.year}`;
		titleCell.font = { bold: true, size: 18, color: { argb: 'FF2D3748' } };
		titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
		worksheet.getRow(1).height = 35;

		// Subtitle
		worksheet.mergeCells('A2:L2');
		const subtitleCell = worksheet.getCell('A2');
		subtitleCell.value = `Σύγκριση με Q${period.comparison_quarter} ${period.comparison_year} | Μ.Ο. Δικτύου: ${period.network_average_percentage}% | Κατάσταση: ${period.status === 'published' ? 'Δημοσιευμένο' : 'Πρόχειρο'}`;
		subtitleCell.font = { italic: true, size: 11, color: { argb: 'FF718096' } };
		subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
		worksheet.getRow(2).height = 22;

		// Export date
		worksheet.mergeCells('A3:L3');
		const dateCell = worksheet.getCell('A3');
		dateCell.value = `Ημερομηνία Εξαγωγής: ${new Date().toLocaleDateString('el-GR', { dateStyle: 'full' })}`;
		dateCell.font = { size: 10, color: { argb: 'FF718096' } };
		dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
		worksheet.getRow(3).height = 18;

		// Empty row
		worksheet.getRow(4).height = 10;

		// ============================================
		// COLUMN HEADERS
		// ============================================
		worksheet.columns = [
			{ key: 'rank', width: 8 },
			{ key: 'org_name', width: 30 },
			{ key: 'current_kilos', width: 16 },
			{ key: 'previous_kilos', width: 16 },
			{ key: 'kilo_difference', width: 14 },
			{ key: 'percentage_change', width: 14 },
			{ key: 'above_avg', width: 12 },
			{ key: 'base_bonus', width: 14 },
			{ key: 'multiplier', width: 12 },
			{ key: 'final_bonus', width: 14 },
			{ key: 'total_bonus_pool', width: 16 },
			{ key: 'total_hours', width: 14 }
		];

		const headers = [
			'#',
			'Οργανισμός',
			'Κιλά (Τρέχον)',
			'Κιλά (Προηγ.)',
			'Διαφορά',
			'Μεταβολή %',
			'Άνω Μ.Ο.',
			'Βασικό Bonus',
			'Πολλαπλ.',
			'Τελικό Bonus',
			'Bonus Pool',
			'Ώρες'
		];

		const headerRow = worksheet.getRow(5);
		headers.forEach((header, index) => {
			const cell = headerRow.getCell(index + 1);
			cell.value = header;
			cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
			cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
			cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
			cell.border = {
				bottom: { style: 'medium', color: { argb: 'FF1A202C' } }
			};
		});
		headerRow.height = 28;

		// ============================================
		// DATA ROWS
		// ============================================
		let rowIndex = 6;

		for (const org of organizations) {
			const kiloDifference = org.current_kilos - org.previous_kilos;

			const row = worksheet.addRow({
				rank: org.rank || '—',
				org_name: org.org_name,
				current_kilos: org.current_kilos,
				previous_kilos: org.previous_kilos,
				kilo_difference: kiloDifference,
				percentage_change: org.percentage_change,
				above_avg: org.above_network_average ? 'Ναι' : 'Όχι',
				base_bonus: org.base_bonus,
				multiplier: org.multiplier,
				final_bonus: org.final_bonus,
				total_bonus_pool: org.total_bonus_pool,
				total_hours: org.total_hours_worked
			});

			row.height = 22;
			row.eachCell((cell, colNumber) => {
				cell.alignment = { horizontal: 'center', vertical: 'middle' };

				// Alternate row colors
				if (rowIndex % 2 === 0) {
					cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FAFC' } };
				}

				// Number formatting
				if ([3, 4, 5].includes(colNumber)) {
					cell.numFmt = '#,##0.00 "kg"';
				}

				// Percentage formatting
				if (colNumber === 6) {
					cell.numFmt = '0.00"%"';
					const pct = Number(cell.value) || 0;
					if (pct > 0) {
						cell.font = { color: { argb: 'FF2F855A' }, bold: true };
					} else if (pct < 0) {
						cell.font = { color: { argb: 'FFC53030' }, bold: true };
					}
				}

				// Above average styling
				if (colNumber === 7) {
					if (cell.value === 'Ναι') {
						cell.font = { color: { argb: 'FF2F855A' }, bold: true };
					}
				}

				// Currency formatting
				if ([8, 10, 11].includes(colNumber)) {
					cell.numFmt = '#,##0.00 €';
				}

				// Multiplier formatting
				if (colNumber === 9) {
					cell.numFmt = '×0.00';
					if (Number(cell.value) > 1) {
						cell.font = { color: { argb: 'FF2F855A' }, bold: true };
					}
				}

				// Hours formatting
				if (colNumber === 12) {
					cell.numFmt = '#,##0.0 "h"';
				}

				// Light borders
				cell.border = {
					bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
				};
			});

			// Highlight top 3
			if (org.rank && org.rank <= 3) {
				const rankCell = row.getCell(1);
				let bgColor = 'FFFEF3C7'; // Gold for 1st
				if (org.rank === 2) bgColor = 'FFF1F5F9'; // Silver
				if (org.rank === 3) bgColor = 'FFFED7AA'; // Bronze
				
				row.eachCell((cell) => {
					cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
				});
			}

			rowIndex++;
		}

		// ============================================
		// SUMMARY ROW
		// ============================================
		const summaryRowIndex = rowIndex + 1;
		worksheet.getRow(rowIndex).height = 10;

		const summaryRow = worksheet.getRow(summaryRowIndex);
		summaryRow.height = 28;

		// Calculate totals
		const totals = organizations.reduce(
			(acc, org) => {
				acc.total_bonus_pool += org.total_bonus_pool || 0;
				acc.total_hours += org.total_hours_worked || 0;
				acc.total_current_kilos += org.current_kilos || 0;
				acc.total_previous_kilos += org.previous_kilos || 0;
				return acc;
			},
			{
				total_bonus_pool: 0,
				total_hours: 0,
				total_current_kilos: 0,
				total_previous_kilos: 0
			}
		);

		worksheet.mergeCells(`A${summaryRowIndex}:B${summaryRowIndex}`);
		const summaryLabelCell = worksheet.getCell(`A${summaryRowIndex}`);
		summaryLabelCell.value = `📊 ΣΥΝΟΛΑ (${organizations.length} οργανισμοί)`;
		summaryLabelCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
		summaryLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
		summaryLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };

		const summaryValues = [
			{ col: 3, value: totals.total_current_kilos, format: '#,##0.00 "kg"' },
			{ col: 4, value: totals.total_previous_kilos, format: '#,##0.00 "kg"' },
			{ col: 11, value: totals.total_bonus_pool, format: '#,##0.00 €' },
			{ col: 12, value: totals.total_hours, format: '#,##0.0 "h"' }
		];

		summaryValues.forEach(({ col, value, format }) => {
			const cell = summaryRow.getCell(col);
			cell.value = value;
			cell.numFmt = format;
			cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
			cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
			cell.alignment = { horizontal: 'center', vertical: 'middle' };
		});

		// Fill remaining summary cells
		for (let col = 1; col <= 12; col++) {
			const cell = summaryRow.getCell(col);
			if (!cell.value && col > 2) {
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
				'Content-Disposition': `attachment; filename="bonus_report_Q${period.quarter}_${period.year}.xlsx"`
			}
		});
	} catch (error) {
		console.error('[Export] Error:', error);
		return json({ error: 'Export failed' }, { status: 500 });
	}
};
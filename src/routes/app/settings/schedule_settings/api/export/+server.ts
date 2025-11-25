import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import ExcelJS from 'exceljs';
import { getProfileByUUId } from '$lib/supabase/queries';
import type { Shift } from '$lib/models/schedule.types';
import { SHIFT_TYPE } from '$lib/models/schedule.types';
import { getScheduleDataForExport } from '../../[id]/data.remote';

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.json();
	const scheduleId = payload.scheduleId as number;

	if (!scheduleId) {
		return json({ error: 'Schedule Id is required' }, { status: 400 });
	}

	try {
		// 1. Fetch Data
		const result = await getScheduleDataForExport({ scheduleId });

		if (!result.success || !result.data) {
			return json({ error: 'Failed to fetch schedule data' }, { status: 500 });
		}

		const { schedule, employees, shifts, weekDays } = result.data;

		// 2. Create Workbook
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Weekly Schedule', {
			pageSetup: {
				orientation: 'landscape'
			}
		});

		// 3. Set Column Widths
		worksheet.columns = [
			{ header: 'Employee', key: 'employee', width: 20 },
			...weekDays.map((day) => ({
				header: `${day.dayName}\n${day.dayNum}`,
				key: day.date,
				width: 18
			})),
			{ header: 'Total Hours', key: 'totalHours', width: 14 }
		];

		// 4. Style Header Row
		const headerRow = worksheet.getRow(1);
		headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
		headerRow.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF1F2937' }
		};
		headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
		headerRow.height = 35;

		// 5. Add Schedule Info Header
		let rowNum = 2;

		const scheduleInfoRow = worksheet.getRow(rowNum);
		const weekRange = `Week of ${formatDate(schedule.week_start_date)} - ${formatDate(
			schedule.week_end_date
		)}`;
		scheduleInfoRow.getCell('employee').value = weekRange;
		scheduleInfoRow.getCell('employee').font = { bold: true, size: 12 };
		scheduleInfoRow.getCell('employee').alignment = { horizontal: 'left' };
		rowNum++;

		const statusRow = worksheet.getRow(rowNum);
		statusRow.getCell('employee').value = `Status: ${capitalize(schedule.status)}`;
		statusRow.getCell('employee').font = { bold: true, size: 10 };
		rowNum++;

		const createdRow = worksheet.getRow(rowNum);
		createdRow.getCell('employee').value = `Created: ${formatDate(schedule.created_at)}`;
		rowNum++;

		const metaRow = worksheet.getRow(rowNum);
		metaRow.getCell('employee').value =
			`Total Employees: ${employees.length} | Total Shifts: ${shifts.length}`;
		metaRow.getCell('employee').font = { italic: true };
		rowNum += 2;

		// 6. Add Employee Shift Data
		worksheet.insertRow(rowNum, []); // Empty row for spacing

		const dataHeaderRow = worksheet.getRow(rowNum + 1);
		dataHeaderRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
		dataHeaderRow.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF374151' }
		};
		dataHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

		rowNum += 2;

		for (const employee of employees) {
			const row = worksheet.getRow(rowNum);
			row.height = 25;

			// Employee name
			row.getCell('employee').value = employee.username;
			row.getCell('employee').font = { bold: true };
			row.getCell('employee').alignment = { horizontal: 'left', vertical: 'middle' };
			row.getCell('employee').fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF3F4F6' }
			};

			let totalMinutes = 0;

			// Add shifts for each day
			for (const day of weekDays) {
				const shift = shifts.find((s) => s.user_id === employee.id && s.shift_date === day.date);
				const cell = row.getCell(day.date);

				if (shift) {
					const shiftText = formatShiftCell(shift);
					cell.value = shiftText;
					cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

					// Color code by shift type
					const bgColor = getShiftTypeColor(shift.shift_type);
					cell.fill = {
						type: 'pattern',
						pattern: 'solid',
						fgColor: { argb: bgColor }
					};

					// Calculate hours for work shifts
					if (shift.shift_type === SHIFT_TYPE.WORK && shift.start_time && shift.end_time) {
						const [startHour, startMin] = shift.start_time.split(':').map(Number);
						const [endHour, endMin] = shift.end_time.split(':').map(Number);

						const startMinutes = startHour * 60 + startMin;
						const endMinutes = endHour * 60 + endMin;
						const shiftMinutes = endMinutes - startMinutes - (shift.break_duration_minutes || 0);

						totalMinutes += shiftMinutes;
					}
				} else {
					cell.value = '-';
					cell.alignment = { horizontal: 'center', vertical: 'middle' };
				}

				cell.border = {
					top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
					left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
					bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
					right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
				};
			}

			// Total hours
			const totalHoursCell = row.getCell('totalHours');
			totalHoursCell.value = formatTotalHours(totalMinutes);
			totalHoursCell.alignment = { horizontal: 'center', vertical: 'middle' };
			totalHoursCell.font = { bold: true };
			totalHoursCell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFECFDF5' }
			};

			rowNum++;
		}

		// 7. Add Legend
		rowNum += 2;
		const legendTitleRow = worksheet.getRow(rowNum);
		legendTitleRow.getCell('employee').value = 'Legend';
		legendTitleRow.getCell('employee').font = { bold: true, size: 11 };
		rowNum++;

		const legends = [
			{ short: 'RP', full: 'Ρεπό (Day Off)' },
			{ short: 'Α', full: 'Αναρρωτική (Sick Leave)' },
			{ short: 'ΑΔ', full: 'Άδεια (Vacation)' },
			{ short: 'HH:MM-HH:MM', full: 'Work shift with times' }
		];

		for (const leg of legends) {
			const row = worksheet.getRow(rowNum);
			row.getCell('employee').value = `${leg.short} - ${leg.full}`;
			rowNum++;
		}

		// 8. Generate Buffer
		const buffer = await workbook.xlsx.writeBuffer();

		// 9. Return File
		return new Response(buffer, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="schedule_${formatDateForFilename(
					schedule.week_start_date
				)}_${formatDateForFilename(schedule.week_end_date)}.xlsx"`
			}
		});
	} catch (error) {
		console.error('Error generating schedule export:', error);
		return json({ error: 'Failed to generate export' }, { status: 500 });
	}
};

// ===== HELPER FUNCTIONS =====

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateForFilename(dateString: string): string {
	const date = new Date(dateString);
	return date.toISOString().split('T')[0];
}

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatShiftCell(shift: Shift): string {
	const shiftLabels: Record<string, string> = {
		work:
			shift.start_time && shift.end_time
				? `${shift.start_time.slice(0, 5)}-${shift.end_time.slice(0, 5)}`
				: 'Work',
		day_off: 'RP',
		sick_leave: 'Α',
		vacation: 'ΑΔ'
	};

	return shiftLabels[shift.shift_type] || shift.shift_type;
}

function getShiftTypeColor(shiftType: string): string {
	const colors: Record<string, string> = {
		work: 'FFDBEAFE', // Blue-100
		day_off: 'FFF0FDF4', // Green-100
		sick_leave: 'FFFEF2F2', // Red-100
		vacation: 'FFFEF9E7' // Yellow-100
	};

	return colors[shiftType] || 'FFFFFFFF';
}

function formatTotalHours(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours === 0 && minutes === 0) return '-';
	if (minutes === 0) return `${hours}h`;
	return `${hours}h ${minutes}m`;
}

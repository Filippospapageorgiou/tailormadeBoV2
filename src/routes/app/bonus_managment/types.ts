// Types for Excel parsing and bonus management

export type Quarter = 1 | 2 | 3 | 4;

// Raw Excel data before mapping
export interface RawExcelData {
	sheetNames: string[];
	selectedSheet: string;
	headers: string[];
	rows: Record<string, any>[];
	headerRowIndex: number;
}

// Column mapping configuration
export interface ColumnMapping {
	org_id: string | null;
	store_name: string | null;
	current_kilos: string | null;
	previous_kilos: string | null;
}

// Our required fields
export const REQUIRED_FIELDS = [
	{ key: 'org_id', label: 'Organization ID', description: 'Μοναδικό ID καταστήματος' },
	{ key: 'store_name', label: 'Όνομα Καταστήματος', description: 'Επωνυμία καταστήματος' },
	{ key: 'current_kilos', label: 'Τρέχοντα Κιλά', description: 'Κιλά τρέχουσας περιόδου' },
	{ key: 'previous_kilos', label: 'Προηγούμενα Κιλά', description: 'Κιλά προηγούμενης περιόδου' }
] as const;

export type FieldKey = (typeof REQUIRED_FIELDS)[number]['key'];

// Parsed row after mapping
export interface ParsedExcelRow {
	org_id: number;
	store_name: string;
	current_kilos: number;
	previous_kilos: number;
	kilo_difference: number;
	percentage_change: number;
}

export interface ExcelParseResult {
	success: boolean;
	data: ParsedExcelRow[];
	errors: string[];
	warnings: string[];
}

export interface BonusImportPayload {
	quarter: Quarter;
	year: number;
	data: ParsedExcelRow[];
}

// Validation result
export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	validRows: ParsedExcelRow[];
}

// Accept Excel MIME types
export const ACCEPT_EXCEL =
	'.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
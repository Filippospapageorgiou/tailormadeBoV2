import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Format a number as currency in EUR
 * @param amount - The amount to format
 * @returns Formatted currency string with EUR symbol
 * @example
 * formatCurrency(123.45) // "€123.45"
 * formatCurrency(0) // "€0.00"
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(amount);
}

/**
 * Format a date string for display
 * @param dateString - ISO date string (YYYY-MM-DD or full ISO)
 * @returns Formatted date string
 * @example
 * formatDate('2024-01-15') // "January 15, 2024"
 * formatDate('2024-01-15T10:30:00') // "January 15, 2024 at 10:30 AM"
 */
export function formatDate(dateString: string): string {
	if (!dateString) return 'N/A';

	try {
		const date = new Date(dateString);

		// Check if it has time component (ISO format with T)
		if (dateString.includes('T')) {
			return new Intl.DateTimeFormat('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: true
			}).format(date);
		}

		// Date only
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	} catch (error) {
		console.error('Error formatting date:', error, dateString);
		return dateString;
	}
}

/**
 * Format a percentage value
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 * @example
 * formatPercentage(12.5) // "12.50%"
 * formatPercentage(12.567, 1) // "12.6%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
	return value.toFixed(decimals) + '%';
}

/**
 * Determine if a cash difference is significant
 * @param difference - The cash difference amount
 * @param threshold - The threshold for "significant" (default: 5)
 * @returns Boolean indicating if difference is significant
 */
export function isCashDiscrepancy(difference: number, threshold: number = 5): boolean {
	return Math.abs(difference) > threshold;
}

/**
 * Get a status badge color class based on status value
 * @param status - The status string
 * @returns CSS class string for styling
 */
export function getStatusBadgeClass(status: string): string {
	switch (status.toLowerCase()) {
		case 'draft':
			return 'bg-amber-100 text-amber-800 border-amber-300';
		case 'submitted':
			return 'bg-blue-100 text-blue-800 border-blue-300';
		case 'reviewed':
			return 'bg-green-100 text-green-800 border-green-300';
		case 'approved':
			return 'bg-green-100 text-green-800 border-green-300';
		case 'rejected':
			return 'bg-red-100 text-red-800 border-red-300';
		default:
			return 'bg-gray-100 text-gray-800 border-gray-300';
	}
}

/**
 * Get human-readable label for a status
 * @param status - The status string
 * @returns Human-readable label
 */
export function getStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		draft: 'Draft',
		submitted: 'Submitted',
		reviewed: 'Reviewed',
		approved: 'Approved',
		rejected: 'Rejected'
	};
	return labels[status.toLowerCase()] || status;
}

/**
 * Format payment method display text
 * @param method - Payment method key (e.g., 'bank_transfer')
 * @returns Formatted display text
 */
export function formatPaymentMethod(method: string): string {
	const methods: Record<string, string> = {
		cash: 'Cash',
		bank_transfer: 'Bank Transfer',
		check: 'Check'
	};
	return methods[method.toLowerCase()] || method;
}

/**
 * Calculate the cash status description
 * @param difference - Cash difference amount
 * @returns Status description string
 */
export function getCashStatusDescription(difference: number): string {
	const abs = Math.abs(difference);
	if (abs < 0.5) return 'Accurate';
	if (abs < 5) return 'Minor Difference';
	return 'Significant Discrepancy';
}

export function formatWeekRange(start: string, end: string): string {
	const startDate = new Date(start);
	const endDate = new Date(end);

	const startDay = startDate.getDate();
	const endDay = endDate.getDate();

	const monthNames = [
		'Ιαν',
		'Φεβ',
		'Μαρ',
		'Απρ',
		'Μαι',
		'Ιουν',
		'Ιουλ',
		'Αυγ',
		'Σεπ',
		'Οκτ',
		'Νοε',
		'Δεκ'
	];
	const month = monthNames[startDate.getMonth()];
	const year = startDate.getFullYear();

	return `Εβδομάδα ${startDay}-${endDay} ${month} ${year}`;
}

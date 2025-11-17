import { query, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Profile, Organization } from '$lib/models/database.types';
import type {
	Supplier,
	DailyRegisterClosing,
	RegisterSupplierPayment,
	RegisterExpense
} from '$lib/models/register.types';
import z from 'zod/v4';
import { error } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';

export const authenticatedAccess = query(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	const { data, error: profileError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.overrideTypes<Profile[]>();

	if (profileError) {
		console.error('Error fetching profile info in load time:', profileError);
		error(404, 'Not found user info');
	}

	let profile: Profile;

	if (data && data.length > 0) profile = data[0];
	else error(404, 'Not found user info');

	if (!profile.can_close_register) {
		return {
			success: false,
			message: 'Δεν έχεις προσβάση σε αυτήν την λειτούργια περιηγήσου πίσω',
			hasAccess: false,
			profile: null
		};
	}
	return {
		success: true,
		message: 'Επιτυχής πρόσβαση στη σελίδα.',
		hasAccess: true,
		profile
	};
});

export const getOpeningFloat = query(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		// Get user's org_id
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('org_id')
			.eq('id', user.id)
			.single<Pick<Profile, 'org_id'>>();

		if (profileError || !profile) {
			console.error('Error fetching user profile:', profileError);
			return {
				success: false,
				message: 'Error fetching user profile'
			};
		}

		// Get yesterday's date in local time
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		// Format as YYYY-MM-DD (local, not UTC)
		const formattedDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

		const { data: registry, error: registryError } = await supabase
			.from('daily_register_closings')
			.select('*')
			.eq('closing_date', formattedDate)
			.eq('org_id', profile.org_id)
			.maybeSingle<DailyRegisterClosing>();

		if (registryError) {
			console.error('Error fetching register data:', registryError);
			return {
				success: false,
				message: 'Error fetching register data'
			};
		}

		return {
			success: true,
			message: 'Opening float retrieved successfully',
			openingFloat: registry?.tomorrow_opening_float || 0.0
		};
	} catch (error) {
		console.error('Error trying to get opening float:', error);
		return {
			success: false,
			message: 'Error trying to get opening float',
			openingFloat: 0.0
		};
	}
});

/**
 * Check if today there was a closing in the registry so
 * it can be another one in the same day
 */

export const checkRegisterToday = query(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();
	try {
		// Get user's org_id
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('org_id')
			.eq('id', user.id)
			.single<Pick<Profile, 'org_id'>>();

		if (profileError || !profile) {
			console.error('Error fetching user profile:', profileError);
			return {
				success: false,
				message: 'Error fetching user profile'
			};
		}

		const today = new Date();
		const formattedDate =
			today.getFullYear() +
			'-' +
			String(today.getMonth() + 1).padStart(2, '0') +
			'-' +
			String(today.getDate()).padStart(2, '0');

		const { data: registry, error: registryError } = await supabase
			.from('daily_register_closings')
			.select('*')
			.eq('closing_date', formattedDate)
			.eq('org_id', profile.org_id)
			.maybeSingle<DailyRegisterClosing>();

		if (registryError) {
			console.error('Error fetching register data:', registryError);
			return {
				success: false,
				message: 'Error fetching register data'
			};
		}

		// Return true if a register exists for today
		const hasRegisterToday = Boolean(registry);

		return {
			success: true,
			message: 'Επιτυχώς διάβασε το αν υπάρχει ταμείο σήμερα',
			hasRegisterToday,
			date: formattedDate
		};
	} catch (error) {
		console.error('An unexpected error occured trying to get register: ', error);
		return {
			success: false,
			hasRegisterToday: false,
			message: 'An unexpected error occured trying to get register',
			date: null
		};
	}
});

// ======================== SCHEMAS ==============

const dailyRegisterSchema = z.object({
	dailyRegister: z.string().optional() // JSON array of expenses
});

// Supplier payment schema (for validation of array items)
const supplierPaymentSchema = z.object({
	supplier_id: z.number().int().positive().nullable().optional(),
	supplier_name: z.string().min(1).nullable().optional(),
	amount: z.number().nonnegative('Amount must be non-negative'),
	payment_method: z.string().default('cash'),
	invoice_number: z.string().nullable().optional(),
	notes: z.string().nullable().optional()
});

// Expense schema (for validation of array items)
const expenseSchema = z.object({
	expense_category: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	amount: z.number().nonnegative('Amount must be non-negative')
});

// New supplier creation schema
const newSupplierSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Supplier name is required'),
	afm: z.string().min(1, 'AFM (Tax ID) is required'),
	phone: z.string().optional(),
	email: z.email().optional(),
	address: z.string().optional(),
	contact_person: z.string().optional(),
	payment_terms: z.string().optional(),
	notes: z.string().optional()
});

/**
 * Create a new supplier in the database
 */
async function createSupplier(
	supabase: SupabaseClient,
	orgId: number,
	supplierData: z.infer<typeof newSupplierSchema>
): Promise<{ success: boolean; supplier?: Supplier; error?: string }> {
	try {
		// Check if supplier with same AFM already exists in this org
		const { data: existing, error: checkError } = await supabase
			.from('suppliers')
			.select('id, name')
			.eq('org_id', orgId)
			.eq('afm', supplierData.afm)
			.maybeSingle<Pick<Supplier, 'id' | 'name'>>();

		if (checkError) {
			console.error('Error checking existing supplier:', checkError);
			return { success: false, error: 'Error checking existing supplier' };
		}

		if (existing) {
			return {
				success: false,
				error: `Supplier with AFM ${supplierData.afm} already exists: ${existing.name}`
			};
		}

		// Create new supplier
		const { data: newSupplier, error: insertError } = await supabase
			.from('suppliers')
			.insert({
				org_id: orgId,
				supplier_id: supplierData.id,
				name: supplierData.name,
				afm: supplierData.afm,
				phone: supplierData.phone || null,
				email: supplierData.email || null,
				address: supplierData.address || null,
				contact_person: supplierData.contact_person || null,
				payment_terms: supplierData.payment_terms || null,
				notes: supplierData.notes || null,
				is_active: true
			})
			.select()
			.single<Supplier>();

		if (insertError) {
			console.error('Error creating supplier:', insertError);
			return { success: false, error: 'Failed to create supplier' };
		}

		return { success: true, supplier: newSupplier };
	} catch (err) {
		console.error('Unexpected error creating supplier:', err);
		return { success: false, error: 'Unexpected error creating supplier' };
	}
}

/**
 * Insert supplier payments for a closing
 */
async function insertSupplierPayments(
	supabase: any,
	closingId: number,
	payments: any[]
): Promise<{ success: boolean; error?: string }> {
	try {
		if (!payments || payments.length === 0) {
			return { success: true }; // No payments to insert
		}

		// Validate all payments
		const validatedPayments = payments.map((p) => supplierPaymentSchema.parse(p));

		// Prepare insert data
		const paymentsToInsert = validatedPayments.map((payment) => ({
			closing_id: closingId,
			supplier_id: payment.supplier_id || null,
			supplier_name: payment.supplier_name || null,
			amount: payment.amount,
			payment_method: payment.payment_method || 'cash',
			invoice_number: payment.invoice_number || null,
			notes: payment.notes || null
		}));

		const { error: insertError } = await supabase
			.from('register_supplier_payments')
			.insert(paymentsToInsert);

		if (insertError) {
			console.error('Error inserting supplier payments:', insertError);
			return { success: false, error: 'Failed to insert supplier payments' };
		}

		return { success: true };
	} catch (err) {
		console.error('Unexpected error inserting supplier payments:', err);
		return { success: false, error: 'Unexpected error inserting supplier payments' };
	}
}

/**
 * Insert expenses for a closing
 */
async function insertExpenses(
	supabase: any,
	closingId: number,
	expenses: any[]
): Promise<{ success: boolean; error?: string }> {
	try {
		if (!expenses || expenses.length === 0) {
			return { success: true }; // No expenses to insert
		}

		// Validate all expenses
		const validatedExpenses = expenses.map((e) => expenseSchema.parse(e));

		// Prepare insert data
		const expensesToInsert = validatedExpenses.map((expense) => ({
			closing_id: closingId,
			expense_category: expense.expense_category || null,
			description: expense.description || null,
			amount: expense.amount
		}));

		const { error: insertError } = await supabase
			.from('register_expenses')
			.insert(expensesToInsert);

		if (insertError) {
			console.error('Error inserting expenses:', insertError);
			return { success: false, error: 'Failed to insert expenses' };
		}

		return { success: true };
	} catch (err) {
		console.error('Unexpected error inserting expenses:', err);
		return { success: false, error: 'Unexpected error inserting expenses' };
	}
}

// ======================== MAIN FORM ==============

export const dailyRegisterForm = form(dailyRegisterSchema, async (data) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();
	try {
		const registerData = JSON.parse(data.dailyRegister || '{}');
		// Get user's org_id

		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('org_id')
			.eq('id', user.id)
			.single<Pick<Profile, 'org_id'>>();

		if (profileError || !profile) {
			console.error('Error fetching user profile:', profileError);
			return {
				success: false,
				message: 'Error fetching user profile'
			};
		}

		const today = new Date();
		const formattedDate =
			today.getFullYear() +
			'-' +
			String(today.getMonth() + 1).padStart(2, '0') +
			'-' +
			String(today.getDate()).padStart(2, '0');

		//insert main closing record
		const { data: newClosing, error: insertError } = await supabase
			.from('daily_register_closings')
			.insert({
				org_id: profile.org_id,
				closing_date: formattedDate,
				closed_by: user.id,
				total_sales: registerData.totalSales,
				card_sales: registerData.cardSales,
				wolt_sales: registerData.woltSales,
				efood_sales: registerData.efoodSales,
				other_digital_sales: registerData.otherDigitalSales,
				excepted_cash: registerData.expectedCash,
				opening_float: registerData.openingFloat,
				final_cash_balance: registerData.expectedFinal,
				actual_cash_counted: registerData.actualCashCounted,
				total_supplier_payments: registerData.totalSupplierPayments,
				total_expenses: registerData.totalExpenses,
				tomorrow_opening_float: registerData.tomorrowOpeningFloat,
				cash_deposit: registerData.cashDeposit,
				notes: null,
				status: 'submitted'
			})
			.select()
			.single<DailyRegisterClosing>();

		if (insertError || !newClosing) {
			console.error('Error creating register closing:', insertError);
			return {
				success: false,
				message: 'Failed to create register closing'
			};
		}

		const suppliersResult = await insertSupplierPayments(
			supabase,
			newClosing.id,
			registerData.supplierPayments
		);

		if (!suppliersResult.success) {
			await supabase.from('daily_register_closings').delete().eq('id', newClosing.id);

			return {
				success: false,
				message: suppliersResult.error || 'Failed to insert supplier payments'
			};
		}

		// Insert expenses
		const expensesResult = await insertExpenses(supabase, newClosing.id, registerData.expenses);

		if (!expensesResult.success) {
			await supabase.from('daily_register_closings').delete().eq('id', newClosing.id);

			return {
				success: false,
				message: expensesResult.error || 'Failed to insert expenses'
			};
		}

		return {
			success: true,
			message: 'Το ταμείο έκλεισε επιτυχώς',
			closing: newClosing
		};
	} catch (error) {
		console.error('An error occurred trying to close register:', error);
		return {
			success: false,
			message: 'An error occurred trying to close register, try again'
		};
	}
});

// ======================== ADDITIONAL QUERIES ==============

/**
 * Get all active suppliers for the organization
 */
export const getActiveSuppliers = query(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		// Get user's org_id
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('org_id')
			.eq('id', user.id)
			.single<Pick<Profile, 'org_id'>>();

		if (profileError || !profile) {
			console.error('Error fetching user profile:', profileError);
			return {
				success: false,
				message: 'Error fetching user profile',
				suppliers: []
			};
		}

		// Get all active suppliers for this org
		const { data: suppliers, error: suppliersError } = await supabase
			.from('suppliers')
			.select('*')
			.eq('org_id', profile.org_id)
			.eq('is_active', true)
			.order('name')
			.overrideTypes<Supplier[]>();

		if (suppliersError) {
			console.error('Error fetching suppliers:', suppliersError);
			return {
				success: false,
				message: 'Error fetching suppliers',
				suppliers: []
			};
		}

		return {
			success: true,
			message: 'Suppliers fetched successfully',
			suppliers: suppliers || []
		};
	} catch (err) {
		console.error('Unexpected error fetching suppliers:', err);
		return {
			success: false,
			message: 'Unexpected error fetching suppliers',
			suppliers: []
		};
	}
});

/**
 * Create a new supplier (separate form for supplier creation)
 */
export const createSupplierForm = form(newSupplierSchema, async (data) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		// Get user's org_id
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('org_id')
			.eq('id', user.id)
			.single<Pick<Profile, 'org_id'>>();

		if (profileError || !profile) {
			console.error('Error fetching user profile:', profileError);
			return {
				success: false,
				message: 'Error fetching user profile'
			};
		}

		const result = await createSupplier(supabase, profile.org_id, data);

		if (!result.success) {
			return {
				success: false,
				message: result.error || 'Failed to create supplier'
			};
		}

		return {
			success: true,
			message: 'Supplier created successfully',
			supplier: result.supplier
		};
	} catch (err) {
		console.error('Unexpected error creating supplier:', err);
		return {
			success: false,
			message: 'Unexpected error creating supplier'
		};
	}
});

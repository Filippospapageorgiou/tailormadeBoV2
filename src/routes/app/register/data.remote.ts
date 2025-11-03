import { query, form } from "$app/server";
import { createServerClient } from "$lib/supabase/server";
import { requireAuthenticatedUser } from "$lib/supabase/shared";
import type { Profile, Organization } from "$lib/models/database.types";
import type { Supplier, DailyRegisterClosing, 
              RegisterSupplierPayment,
              RegisterExpense } from "$lib/models/register.types";
import z from "zod/v4";
import { error } from '@sveltejs/kit';
import type { SupabaseClient } from "@supabase/supabase-js";


export const authenticatedAccess = query(async () => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();

    const {data , error:profileError} = await supabase
      .from('profiles')
      .select('*')
      .eq('id',user.id)
      .overrideTypes<Profile[]>();

    if(profileError){
      console.error('Error fetching profile info in load time:', profileError);
      error(404,'Not found user info');
    }

    let profile:Profile;

    if(data && data.length > 0)  profile = data[0];
    else error(404,'Not found user info');

    if(!profile.can_close_register){
        return{
            success:false,
            message:'Δεν έχεις προσβάση σε αυτήν την λειτούργια περιηγήσου πίσω',
            hasAccess: false,
            profile:null
        }
    }
    return {
        success: true,
        message: 'Επιτυχής πρόσβαση στη σελίδα.',
        hasAccess: true,
        profile,
    };
})

export const getOpeningFloat = query(async() => {
  const supabase = createServerClient();
  const user = await requireAuthenticatedUser();
  try{

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
            };
        }
        
        // Get yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        // Format as YYYY-MM-DD
        const formattedDate = yesterday.toISOString().split('T')[0];

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
                message: 'Error fetching register data',
            };
        }

        // Return the opening float from yesterday's closing
        if (registry) {
            return {
                success: true,
                message: 'Opening float retrieved successfully',
                openingFloat: registry.tomorrowOpeningFloat || 0.0
            };
        } else {
            // No register from yesterday found
            return {
                success: true,
                message: 'No previous register found',
                openingFloat: 0.0
            };
        }

  } catch(error) {
    console.error('Error trying to get opening float: ', error);
    return {
      success: false,
      message: 'Error trying to get opening float',
      openingFloat: 0.0
    }
  }
  
});

/**
 * Check if today there was a closing in the registry so 
 * it can be another one in the same day
 */

export const checkRegisterToday = query(async () => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();
    try{

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
            };
        }

        // Get today's date
        const today = new Date();
        // If you want to format it as YYYY-MM-DD (for database queries)
        const formattedDate = today.toISOString().split('T')[0];

        const { data:registry, error:registryError } = await supabase
            .from('daily_register_closings')
            .select('*')
            .eq('closing_date',formattedDate)
            .eq('org_id',profile.org_id)
            .maybeSingle<DailyRegisterClosing>();


        if (registryError) {
            console.error('Error fetching register data:', registryError);
            return {
                success: false,
                message: 'Error fetching register data',
            };
        }

        // Return true if a register exists for today
        const hasRegisterToday = Boolean(registry);

        return {
            success: true,
            message:'Επιτυχώς διάβασε το αν υπάρχει ταμείο σήμερα',
            hasRegisterToday,
            date: formattedDate,
        };
    }catch(error){
        console.error('An unexpected error occured trying to get register: ',error);
        return{
            success:false,
            hasRegisterToday:false,
            message:'An unexpected error occured trying to get register',
            date:null
        };
    }
});

// ======================== SCHEMAS ==============

const dailyRegisterSchema = z.object({
  closing_date: z.string().min(1, "Closing date is required"),
  total_sales: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().nonnegative("Total sales must be non-negative")),
  
  card_sales: z
    .string()
    .transform((val) => parseFloat(val) || 0)
    .pipe(z.number().nonnegative("Card sales must be non-negative")),
  
  wolt_sales: z
    .string()
    .transform((val) => parseFloat(val) || 0)
    .pipe(z.number().nonnegative("Wolt sales must be non-negative")),
  
  efood_sales: z
    .string()
    .transform((val) => parseFloat(val) || 0)
    .pipe(z.number().nonnegative("Efood sales must be non-negative")),
  
  other_digital_sales: z
    .string()
    .transform((val) => parseFloat(val) || 0)
    .pipe(z.number().nonnegative("Other digital sales must be non-negative")),

  // Cash handling
  opening_float: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().nonnegative("Opening float must be non-negative")),
  
  actual_cash_counted: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().nonnegative("Actual cash must be non-negative")),
  
  tommorow_opening_float: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().nonnegative("Tomorrow opening float must be non-negative")),
  
  cash_deposit: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().nonnegative("Cash deposit float must be non-negative")),
  // Optional fields
  notes: z.string().optional(),
  
  // Status defaults to 'submitted' 
  status: z.enum(["draft", "submitted", "reviewed"]).default("submitted"),
  
  // Suppliers and expenses as JSON strings (will be parsed)
  suppliers: z.string().optional(), // JSON array of supplier payments
  expenses: z.string().optional()   // JSON array of expenses
});

// Supplier payment schema (for validation of array items)
const supplierPaymentSchema = z.object({
  supplier_id: z.number().int().positive().nullable().optional(),
  supplier_name: z.string().min(1).nullable().optional(),
  amount: z.number().nonnegative("Amount must be non-negative"),
  payment_method: z.string().default("cash"),
  invoice_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Expense schema (for validation of array items)
const expenseSchema = z.object({
  expense_category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().nonnegative("Amount must be non-negative"),
});

// New supplier creation schema
const newSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  afm: z.string().min(1, "AFM (Tax ID) is required"),
  phone: z.string(),
  email: z.email(),
  address: z.string(),
  contact_person: z.string(),
  payment_terms: z.string(),
  notes: z.string(),
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
    const validatedPayments = payments.map(p => supplierPaymentSchema.parse(p));

    // Prepare insert data
    const paymentsToInsert = validatedPayments.map(payment => ({
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
    const validatedExpenses = expenses.map(e => expenseSchema.parse(e));

    // Prepare insert data
    const expensesToInsert = validatedExpenses.map(expense => ({
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

    // Check if closing already exists for this date
    const { data: existingClosing, error: checkError } = await supabase
      .from('daily_register_closings')
      .select('id')
      .eq('org_id', profile.org_id)
      .eq('closing_date', data.closing_date)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing closing:', checkError);
      return {
        success: false,
        message: 'Error checking existing closing'
      };
    }

    if (existingClosing) {
      return {
        success: false,
        message: 'A register closing already exists for this date'
      };
    }

    // Calculate computed fields
    const excepted_cash = data.total_sales - (
      data.card_sales + 
      data.wolt_sales + 
      data.efood_sales + 
      data.other_digital_sales
    );

    // Parse suppliers and expenses from JSON strings
    let supplierPayments: any[] = [];
    let expensesList: any[] = [];
    let total_supplier_payments = 0;
    let total_expenses = 0;

    if (data.suppliers) {
      try {
        supplierPayments = JSON.parse(data.suppliers);
        total_supplier_payments = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      } catch (e) {
        console.error('Error parsing suppliers:', e);
        return {
          success: false,
          message: 'Invalid supplier data format'
        };
      }
    }

    if (data.expenses) {
      try {
        expensesList = JSON.parse(data.expenses);
        total_expenses = expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);
      } catch (e) {
        console.error('Error parsing expenses:', e);
        return {
          success: false,
          message: 'Invalid expense data format'
        };
      }
    }

    const cash_diffrence = data.actual_cash_counted - (excepted_cash + data.opening_float);
    const final_cash_balance = data.actual_cash_counted - total_supplier_payments - total_expenses;

    // Insert main closing record
    const { data: newClosing, error: insertError } = await supabase
      .from('daily_register_closings')
      .insert({
        org_id: profile.org_id,
        closing_date: data.closing_date,
        closed_by: user.id,
        total_sales: data.total_sales,
        card_sales: data.card_sales,
        wolt_sales: data.wolt_sales,
        efood_sales: data.efood_sales,
        other_digital_sales: data.other_digital_sales,
        excepted_cash: excepted_cash,
        opening_float: data.opening_float,
        actual_cash_counted: data.actual_cash_counted,
        cash_diffrence: cash_diffrence,
        total_supplier_payments: total_supplier_payments,
        total_expenses: total_expenses,
        final_cash_balance: final_cash_balance,
        tomorrow_opening_float: data.tommorow_opening_float,
        cash_deposit:data.cash_deposit,
        notes: data.notes || null,
        status: data.status || 'submitted'
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

    // Insert supplier payments
    const suppliersResult = await insertSupplierPayments(
      supabase,
      newClosing.id,
      supplierPayments
    );

    if (!suppliersResult.success) {
      // Try to delete the closing since suppliers failed
      await supabase
        .from('daily_register_closings')
        .delete()
        .eq('id', newClosing.id);

      return {
        success: false,
        message: suppliersResult.error || 'Failed to insert supplier payments'
      };
    }

    // Insert expenses
    const expensesResult = await insertExpenses(
      supabase,
      newClosing.id,
      expensesList
    );

    if (!expensesResult.success) {
      // Try to delete the closing since expenses failed
      await supabase
        .from('daily_register_closings')
        .delete()
        .eq('id', newClosing.id);

      return {
        success: false,
        message: expensesResult.error || 'Failed to insert expenses'
      };
    }

    return {
      success: true,
      message: 'Register closing created successfully',
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
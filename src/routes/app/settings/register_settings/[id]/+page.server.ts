import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { 
  getUserProfileWithRoleCheck,  
} from '$lib/supabase/queries';
import type { 
  DailyRegisterClosingWithDetails, 
  RegisterSupplierPaymentWithSupplier,
  RegisterExpense 
} from '$lib/models/register.types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  const profile = await getUserProfileWithRoleCheck([1, 2]); 
  const { id } = params;
  
  if (!id || isNaN(Number(id))) {
    throw error(400, 'Invalid closing ID');
  }

  const closingId = Number(id);

  try {
    // Fetch the main register closing record
    const { data: closing, error: closingError } = await supabase
      .from('daily_register_closings')
      .select('*')
      .eq('id', closingId)
      .eq('org_id', profile.org_id)
      .single();

    if (closingError || !closing) {
      throw error(404, 'Register closing not found');
    }

    // Fetch the user who closed the register
    const { data: closedByProfile, error: closedByError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', closing.closed_by)
      .single();

    // Fetch supplier payments
    const { data: supplierPayments, error: paymentsError } = await supabase
      .from('register_supplier_payments')
      .select('*')
      .eq('closing_id', closingId)
      .order('created_at', { ascending: false });

    // Fetch expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('register_expenses')
      .select('*')
      .eq('closing_id', closingId)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching supplier payments:', paymentsError);
    }

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
    }

    return {
      closing: closing as DailyRegisterClosingWithDetails,
      closedByProfile: closedByProfile || null,
      supplierPayments: (supplierPayments || []) as RegisterSupplierPaymentWithSupplier[],
      expenses: (expenses || []) as RegisterExpense[],
      profile,
    };
  } catch (err) {
    console.error('Error loading register closing details:', err);
    throw error(500, 'Failed to load register closing data');
  }
};
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
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

export const actions: Actions = {
  update: async ({ request, params, locals: { supabase } }) => {
    const profile = await getUserProfileWithRoleCheck([1, 2]);
    const closingId = Number(params.id);

    if (!closingId || isNaN(closingId)) {
      return fail(400, { success: false, message: 'Invalid closing ID' });
    }

    const formData = await request.formData();
    const updateDataRaw = formData.get('updateData');

    if (!updateDataRaw || typeof updateDataRaw !== 'string') {
      return fail(400, { success: false, message: 'No update data provided' });
    }

    try {
      const updateData = JSON.parse(updateDataRaw);

      // Update the main closing record
      const { error: updateError } = await supabase
        .from('daily_register_closings')
        .update({
          total_sales: updateData.total_sales,
          card_sales: updateData.card_sales,
          wolt_sales: updateData.wolt_sales,
          efood_sales: updateData.efood_sales,
          other_digital_sales: updateData.other_digital_sales,
          opening_float: updateData.opening_float,
          actual_cash_counted: updateData.actual_cash_counted,
          excepted_cash: updateData.excepted_cash,
          total_supplier_payments: updateData.total_supplier_payments,
          total_expenses: updateData.total_expenses,
          tomorrow_opening_float: updateData.tomorrow_opening_float,
          cash_deposit: updateData.cash_deposit,
        })
        .eq('id', closingId)
        .eq('org_id', profile.org_id);

      if (updateError) {
        console.error('Error updating register closing:', updateError);
        return fail(500, { success: false, message: 'Failed to update register closing' });
      }

      // Update supplier payments: delete old, insert new
      if (updateData.supplierPayments) {
        const { error: deletePaymentsError } = await supabase
          .from('register_supplier_payments')
          .delete()
          .eq('closing_id', closingId);

        if (deletePaymentsError) {
          console.error('Error deleting old supplier payments:', deletePaymentsError);
        }

        if (updateData.supplierPayments.length > 0) {
          const paymentsToInsert = updateData.supplierPayments.map((p: any) => ({
            closing_id: closingId,
            supplier_id: p.supplier_id || null,
            supplier_name: p.supplier_name || null,
            amount: p.amount,
            payment_method: p.payment_method || 'cash',
            invoice_number: p.invoice_number || null,
            notes: p.notes || null,
          }));

          const { error: insertPaymentsError } = await supabase
            .from('register_supplier_payments')
            .insert(paymentsToInsert);

          if (insertPaymentsError) {
            console.error('Error inserting supplier payments:', insertPaymentsError);
            return fail(500, { success: false, message: 'Failed to update supplier payments' });
          }
        }
      }

      // Update expenses: delete old, insert new
      if (updateData.expenses) {
        const { error: deleteExpensesError } = await supabase
          .from('register_expenses')
          .delete()
          .eq('closing_id', closingId);

        if (deleteExpensesError) {
          console.error('Error deleting old expenses:', deleteExpensesError);
        }

        if (updateData.expenses.length > 0) {
          const expensesToInsert = updateData.expenses.map((e: any) => ({
            closing_id: closingId,
            expense_category: e.expense_category || null,
            description: e.description || null,
            amount: e.amount,
          }));

          const { error: insertExpensesError } = await supabase
            .from('register_expenses')
            .insert(expensesToInsert);

          if (insertExpensesError) {
            console.error('Error inserting expenses:', insertExpensesError);
            return fail(500, { success: false, message: 'Failed to update expenses' });
          }
        }
      }

      return { success: true, message: 'Το ταμείο ενημερώθηκε με επιτυχία.' };
    } catch (err) {
      console.error('Error updating register closing:', err);
      return fail(500, { success: false, message: 'An error occurred while updating' });
    }
  }
};

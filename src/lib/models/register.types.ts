// ============================================
// Register Closing System Types
// ============================================
import { type Profile } from "./database.types";

// Constants for register closing system
export const REGISTER_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVIEWED: 'reviewed'
} as const;

export const PAYMENT_METHOD = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHECK: 'check'
} as const;

export type RegisterStatus = typeof REGISTER_STATUS[keyof typeof REGISTER_STATUS];
export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

/**
 * Supplier - Προμηθευτής
 */
export interface Supplier {
  id: number;
  org_id: number;
  name: string;
  afm: string; // ΑΦΜ (Greek Tax ID)
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  payment_terms: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Daily Register Closing - Ημερήσιο Κλείσιμο Ταμείου
 */
export interface DailyRegisterClosing {
  id: number;
  org_id: number;
  closing_date: string; // 'YYYY-MM-DD'
  closed_by: string; // UUID
  
  // Sales breakdown
  total_sales: number;
  card_sales: number;
  wolt_sales: number;
  efood_sales: number;
  other_digital_sales: number;
  
  excepted_cash: number;
  
  // Cash handling
  opening_float: number;
  actual_cash_counted: number;
  
  // Calculated difference (generated column)
  cash_diffrence: number;
  
  // Payments & Expenses
  total_supplier_payments: number;
  total_expenses: number;
  
  // Final balance (generated column)
  final_cash_balance: number;
  
  // Metadata
  notes: string | null;
  status: RegisterStatus;
  reviewed_by: string | null; // UUID
  reviewed_at: string | null; // ISO timestamp

  tomorrow_opening_float:number;
  cash_deposit: number;
  
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Register Supplier Payment - Πληρωμή Προμηθευτή από Ταμείο
 */
export interface RegisterSupplierPayment {
  id: number;
  closing_id: number;
  supplier_id: number | null;
  supplier_name: string | null;
  amount: number;
  payment_method: PaymentMethod;
  invoice_number: string | null;
  notes: string | null;
  created_at: string; // ISO timestamp
}

/**
 * Register Expense - Έξοδα από Ταμείο
 */
export interface RegisterExpense {
  id: number;
  closing_id: number;
  expense_category: string | null;
  description: string | null;
  amount: number;
  created_at: string; // ISO timestamp
}



// ============================================
// Extended Types with Relations
// ============================================

/**
 * Daily Register Closing with full details
 * Includes supplier payments, expenses, and user info
 */
export interface DailyRegisterClosingWithDetails extends DailyRegisterClosing {
  closed_by_profile: Profile;
  reviewed_by_profile: Profile | null;
  supplier_payments: RegisterSupplierPaymentWithSupplier[];
  expenses: RegisterExpense[];
}

/**
 * Register Supplier Payment with Supplier details
 */
export interface RegisterSupplierPaymentWithSupplier extends RegisterSupplierPayment {
  supplier: Supplier | null;
}

/**
 * Supplier with payment statistics
 */
export interface SupplierWithStats extends Supplier {
  payment_count: number;
  total_paid: number;
  avg_payment: number;
  last_payment_date: string | null;
}

// ============================================
// API/Form Types
// ============================================

/**
 * Form data for creating a new register closing
 */
export interface CreateRegisterClosingInput {
  org_id: number;
  closing_date: string; // 'YYYY-MM-DD'
  total_sales: number;
  card_sales: number;
  wolt_sales: number;
  efood_sales: number;
  other_digital_sales?: number;
  opening_float: number;
  actual_cash_counted: number;
  notes?: string;
  supplier_payments: CreateSupplierPaymentInput[];
  expenses: CreateExpenseInput[];
}

/**
 * Form data for supplier payment
 */
export interface CreateSupplierPaymentInput {
  supplier_id?: number;
  supplier_name?: string;
  amount: number;
  payment_method?: PaymentMethod;
  invoice_number?: string;
  notes?: string;
}

/**
 * Form data for expense
 */
export interface CreateExpenseInput {
  expense_category?: string;
  description?: string;
  amount: number;
}

/**
 * Form data for creating/updating supplier
 */
export interface SupplierInput {
  id:number;
  org_id: number;
  name: string;
  afm: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_person?: string;
  payment_terms?: string;
  notes?: string;
  is_active?: boolean;
}

/**
 * Register closing summary for dashboard
 */
export interface RegisterClosingSummary {
  closing_date: string;
  total_sales: number;
  cash_difference: number;
  status: RegisterStatus;
  closed_by_username: string;
  has_discrepancy: boolean; // Math.abs(cash_difference) > threshold
}

/**
 * Analytics data for register closings
 */
export interface RegisterAnalytics {
  period: string; // 'week', 'month', 'year'
  total_revenue: number;
  card_revenue: number;
  cash_revenue: number;
  avg_daily_sales: number;
  total_supplier_payments: number;
  total_expenses: number;
  avg_cash_discrepancy: number;
  closing_count: number;
}

/**
 * Supplier analytics
 */
export interface SupplierAnalytics {
  supplier_id: number;
  supplier_name: string;
  payment_count: number;
  total_paid: number;
  avg_payment: number;
  first_payment: string;
  last_payment: string;
  monthly_breakdown: {
    month: string;
    total: number;
    count: number;
  }[];
}


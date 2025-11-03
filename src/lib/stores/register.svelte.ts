import { getContext, setContext } from 'svelte';
import type { CreateSupplierPaymentInput, CreateExpenseInput } from '$lib/models/register.types';

const SALES_REGISTER_KEY = Symbol('sales_register');

export interface SalesType {
    totalSales: number;
    cardSales: number;
    woltSales: number;
    efoodSales: number;
    otherDigitalSales: number;
    actualCashCounted: number;
    totalSupplierPayments: number;
    totalExpenses: number;
    openingFloat: number;
    supplierPayments : CreateSupplierPaymentInput[];
    expenses : CreateExpenseInput[];
}

export class Sales {
    totalSales = $state(0);
    cardSales = $state(0);
    woltSales = $state(0);
    efoodSales = $state(0);
    otherDigitalSales = $state(0);
    actualCashCounted = $state(0);
    openingFloat = $state(0);
    supplierPayments = $state<CreateSupplierPaymentInput[]>([]);
    expenses = $state<CreateExpenseInput[]>([]);

    totalSupplierPayments = $derived(
        this.supplierPayments
        .filter(p => p.payment_method === 'cash')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    );

    totalExpenses = $derived(
        this.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    );

    digital = $derived(
        this.cardSales + this.woltSales + this.efoodSales + this.otherDigitalSales
    )

    // Derived values - automatically recalculate
    expectedCash = $derived(
        this.totalSales - (this.digital + this.totalSupplierPayments + this.totalExpenses)
    );

    expectedFinal = $derived(
        this.expectedCash + this.openingFloat
    );

    difference = $derived(
        this.actualCashCounted > 0 
            ? this.actualCashCounted - (this.expectedFinal + this.openingFloat)
            : 0
    );

    constructor(sales: SalesType | null = null) {
        if (sales) {
            this.totalSales = sales.totalSales;
            this.cardSales = sales.cardSales;
            this.woltSales = sales.woltSales;
            this.efoodSales = sales.efoodSales;
            this.otherDigitalSales = sales.otherDigitalSales;
            this.actualCashCounted = sales.actualCashCounted;
            this.openingFloat = sales.openingFloat;
            this.supplierPayments = sales.supplierPayments;
            this.expenses = sales.expenses;
        }
    }
}

// This function SETS the context (only call once in the root parent component)
export function setSalesRegister(sales: SalesType | null = null): Sales {
    const store = new Sales(sales);
    setContext(SALES_REGISTER_KEY, store);
    return store;
}

// This function GETS the context (call in any child component)
export function getSalesRegister(): Sales {
    return getContext(SALES_REGISTER_KEY);
}
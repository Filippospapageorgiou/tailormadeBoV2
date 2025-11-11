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
    openingFloat: number;
    supplierPayments: CreateSupplierPaymentInput[];
    expenses: CreateExpenseInput[];
    tommorow_opening_float: number;
    cash_deposit: number;
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
    tommorow_opening_float = $state(0);
    cash_deposit = $state(0);

    // Safe number conversion helper
    private toNumber(value: any): number {
        if (value === null || value === undefined || value === '') return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }

    totalSupplierPayments = $derived(
        this.supplierPayments
            .filter(p => p.payment_method === 'cash')
            .reduce((sum, p) => sum + this.toNumber(p.amount), 0)
    );

    totalExpenses = $derived(
        this.expenses.reduce((sum, e) => sum + this.toNumber(e.amount), 0)
    );

    digital = $derived(
        this.toNumber(this.cardSales) + 
        this.toNumber(this.woltSales) + 
        this.toNumber(this.efoodSales) + 
        this.toNumber(this.otherDigitalSales)
    );

    // Derived values - automatically recalculate
    expectedCash = $derived(
        this.toNumber(this.totalSales) - 
        (this.digital + this.totalSupplierPayments + this.totalExpenses)
    );

    expectedFinal = $derived(
        this.expectedCash + this.toNumber(this.openingFloat)
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
            this.tommorow_opening_float = sales.tommorow_opening_float;
            this.cash_deposit = sales.cash_deposit;
        }
    }

    getActualCashCounted() {
        return this.toNumber(this.actualCashCounted);
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
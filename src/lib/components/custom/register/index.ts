export interface SalesType {
    totalSales: string;
    cardSales: string;
    woltSales: string;
    efoodSales: string;
    otherDigitalSales: string;
    expectedCash: string;
}

export class sales {
    totalSales = $state('');
    cardSales = $state('');
    woltSales = $state('');
    efoodSales = $state('');
    otherDigitalSales = $state('');
    expectedCash = $state('');

    constructor(sales: SalesType | null) {
        if (sales) {
            this.totalSales = sales.totalSales;
            this.cardSales = sales.cardSales;
            this.woltSales = sales.woltSales;
            this.efoodSales = sales.efoodSales;
            this.otherDigitalSales = sales.otherDigitalSales;
            this.expectedCash = sales.expectedCash;
        }
    }

    /**
     * Converts any float or number values in the object to strings.
     * If already string, leaves them as-is.
     */
    static fromFloats(input: Partial<Record<keyof SalesType, number | string>>): SalesType {
        return {
            totalSales: String(input.totalSales ?? ''),
            cardSales: String(input.cardSales ?? ''),
            woltSales: String(input.woltSales ?? ''),
            efoodSales: String(input.efoodSales ?? ''),
            otherDigitalSales: String(input.otherDigitalSales ?? ''),
            expectedCash: String(input.expectedCash ?? '')
        };
    }

    /**
     * Converts current instance's numeric values (if any) to strings in place.
     */
    convertFloatsToStrings(): void {
        (Object.keys(this) as (keyof SalesType)[]).forEach(key => {
            const value = (this as any)[key];
            if (typeof value === 'number') {
                (this as any)[key] = String(value);
            }
        });
    }
}

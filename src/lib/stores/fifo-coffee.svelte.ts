// ============================================
// FIFO Coffee Evaluation Store — Svelte 5 Runes
// TailorMade BO
// ============================================

import { getContext, setContext } from 'svelte';

const FIFO_COFFEE_KEY = Symbol('fifo_coffee');

export type FifoCoffeeType =
	| 'espresso'
	| 'filter'
	| 'organic'
	| 'decaf'
	| 'greek_coffee'
	| 'instant';

export const FIFO_COFFEE_LABELS: Record<FifoCoffeeType, string> = {
	espresso: 'Espresso',
	filter: 'Filter',
	organic: 'Organic',
	decaf: 'Decaf',
	greek_coffee: 'Ελληνικός Καφές',
	instant: 'Instant Coffee'
};

export type FifoCoffeeStatus = 'peak' | 'too_fresh' | 'expired' | 'unknown';

export interface FifoCoffeeItem {
	coffee_type: FifoCoffeeType;
	roast_date: string; // YYYY-MM-DD, empty string = not set
}

export interface FifoCoffeeComputed {
	daysOld: number | null;
	status: FifoCoffeeStatus;
	score: number; // 0–5
}

export function computeFifoScore(roastDate: string | null): FifoCoffeeComputed {
	if (!roastDate) return { daysOld: null, status: 'unknown', score: 0 };

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const roast = new Date(roastDate);
	const daysOld = Math.floor((today.getTime() - roast.getTime()) / (1000 * 60 * 60 * 24));

	if (daysOld < 10) return { daysOld, status: 'too_fresh', score: 3 };
	if (daysOld <= 30) return { daysOld, status: 'peak', score: 5 };
	return { daysOld, status: 'expired', score: 1 };
}

export class FifoCoffeeStore {
	items = $state<FifoCoffeeItem[]>([
		{ coffee_type: 'espresso', roast_date: '' },
		{ coffee_type: 'filter', roast_date: '' },
		{ coffee_type: 'organic', roast_date: '' },
		{ coffee_type: 'decaf', roast_date: '' },
		{ coffee_type: 'greek_coffee', roast_date: '' },
		{ coffee_type: 'instant', roast_date: '' }
	]);

	// 0–100 for radar chart (average of scored items)
	readonly sectionScore = $derived(
		(() => {
			const scored = this.items.filter((i) => i.roast_date);
			if (!scored.length) return 0;
			const total = scored.reduce((sum, i) => sum + computeFifoScore(i.roast_date).score, 0);
			return Math.round((total / (scored.length * 5)) * 100);
		})()
	);

	setDate(coffeeType: FifoCoffeeType, date: string) {
		const item = this.items.find((i) => i.coffee_type === coffeeType);
		if (item) item.roast_date = date;
	}

	getItem(coffeeType: FifoCoffeeType): FifoCoffeeItem {
		return this.items.find((i) => i.coffee_type === coffeeType)!;
	}
}

export function setFifoCoffeeContext(): FifoCoffeeStore {
	const store = new FifoCoffeeStore();
	setContext(FIFO_COFFEE_KEY, store);
	return store;
}

export function getFifoCoffeeContext(): FifoCoffeeStore {
	return getContext<FifoCoffeeStore>(FIFO_COFFEE_KEY);
}

// ============================================
// Equipment Evaluation Store — Svelte 5 Runes
// TailorMade BO
// ============================================
// Handles only: equipment blocks + check items
// Equipment list/selection managed externally
// ============================================

import { getContext, setContext } from 'svelte';
import type {
	EquipmentEvaluation,
	EquipmentCheckItem,
	EquipmentEvaluationWithChecks
} from '$lib/models/trainers.types';

const EQUIPMENT_EVAL_KEY = Symbol('equipment_evaluation');

// ─── Store ───────────────────────────────────────────────

export class EquipmentEvaluationStore {
	equipments = $state<EquipmentEvaluationWithChecks[]>([]);

	readonly totalEquipments = $derived(this.equipments.length);
	readonly totalScore = $derived(this.equipments.reduce((sum, e) => sum + (e.score ?? 0), 0));
	readonly averageScore = $derived(
		this.equipments.length > 0 ? this.totalScore / this.equipments.length : 0
	);
	readonly allChecksPassed = $derived(
		this.equipments.every((e) => e.equipment_check_items.every((c) => c.passed === true))
	);

	load(evalutions: EquipmentEvaluationWithChecks[]) {
		this.equipments = evalutions;
	}

	addEvaluation(evaluation: EquipmentEvaluation) {
		this.equipments.push({ ...evaluation, equipment_check_items: [] });
	}

	updateEvaluation(id: number, partial: Partial<Pick<EquipmentEvaluation, 'score' | 'notes'>>) {
		const found = this.equipments.find((e) => e.id === id);
		if (!found) return;
		if (partial.score !== undefined) found.score = partial.score;
		if (partial.notes !== undefined) found.notes = partial.notes;
	}

	removeEvaluation(id: number) {
		this.equipments = this.equipments.filter((e) => e.id !== id);
	}

	addCheckItem(equipmentEvalId: number, item: EquipmentCheckItem) {
		const found = this.equipments.find((e) => e.id === equipmentEvalId);
		if (!found) return;
		found.equipment_check_items.push(item);
	}

	updateCheckItem(
		equipmentEvalId: number,
		itemId: number,
		partial: Partial<Omit<EquipmentCheckItem, 'id' | 'equipment_eval_id' | 'created_at'>>
	) {
		const found = this.equipments.find((e) => e.id === equipmentEvalId);
		if (!found) return;
		const item = found.equipment_check_items.find((c) => c.id === itemId);
		if (!item) return;
		Object.assign(item, partial);
	}

	// Toggle passed on a single check item
	toggleCheckItem(equipmentEvalId: number, itemId: number) {
		const found = this.equipments.find((e) => e.id === equipmentEvalId);
		if (!found) return;
		const item = found.equipment_check_items.find((c) => c.id === itemId);
		if (!item) return;
		item.passed = !item.passed;
	}

	removeCheckItem(equipmentEvalId: number, itemId: number) {
		const found = this.equipments.find((e) => e.id === equipmentEvalId);
		if (!found) return;
		found.equipment_check_items = found.equipment_check_items.filter((c) => c.id !== itemId);
	}

	// Replace all check items for an evaluation at once (useful after a DB fetch)
	setCheckItems(equipmentEvalId: number, items: EquipmentCheckItem[]) {
		const found = this.equipments.find((e) => e.id === equipmentEvalId);
		if (!found) return;
		found.equipment_check_items = items;
	}

	// ─── Helpers ──────────────────────────────────────────

	getEvaluation(id: number): EquipmentEvaluationWithChecks | undefined {
		return this.equipments.find((e) => e.id === id);
	}

	getCheckItems(equipmentEvalId: number): EquipmentCheckItem[] {
		return this.equipments.find((e) => e.id === equipmentEvalId)?.equipment_check_items ?? [];
	}

	getScore(id: number): number {
		return this.equipments.find((e) => e.id === id)?.score ?? 0;
	}

	setScore(id: number, value: number) {
		this.updateEvaluation(id, { score: value });
	}

	clear() {
		this.equipments = [];
	}
}

// ─── Context ─────────────────────────────────────────────

export function setEquipmentEvalContext(): EquipmentEvaluationStore {
	const store = new EquipmentEvaluationStore();
	setContext(EQUIPMENT_EVAL_KEY, store);
	return store;
}

export function getEquipmentEvalContext(): EquipmentEvaluationStore {
	return getContext(EQUIPMENT_EVAL_KEY);
}

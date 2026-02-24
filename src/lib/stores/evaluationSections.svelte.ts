// ============================================
// Evaluation Sections Store — Svelte 5 Runes
// TailorMade BO
// ============================================
// Owns: section checklist items + barista training
// Equipment blocks managed by EquipmentEvaluationStore
// ============================================

import { getContext, setContext } from 'svelte';
import type {
	EvaluationSectionItem,
	EvaluationSectionItemUpdate,
	EvaluationBaristaTraining,
	EvaluationBaristaTrainingUpdate,
	EvaluationSectionGroup
} from '$lib/models/trainers.types';
import {
	ALL_DEFAULT_ITEMS,
	SECTION_META,
	type EvaluationSection
} from '$lib/models/evalution_section_const.types';

const EVALUATION_SECTIONS_KEY = Symbol('evaluation_sections');

// ─── Store ────────────────────────────────────────────────────────────────────

export class EvaluationSectionsStore {
	sectionItems = $state<EvaluationSectionItem[]>([]);
	baristaTraining = $state<EvaluationBaristaTraining | null>(null);

	// ─── Derived ──────────────────────────────────────────────────────────────

	// Total score across all checked items
	readonly totalScore = $derived(
		this.sectionItems
			.filter((i) => i.checked)
			.reduce((sum, i) => sum + (i.score ?? 0), 0)
	);

	// How many items are checked across all sections
	readonly totalChecked = $derived(
		this.sectionItems.filter((i) => i.checked).length
	);

	// Items grouped by section — useful for rendering each section block
	readonly groupedSections = $derived<EvaluationSectionGroup[]>(
		(['cleanliness', 'knowledge', 'training'] as EvaluationSection[]).map((section) => {
			const items = this.sectionItems.filter((i) => i.section === section);
			return {
				section,
				items,
				totalScore: items.filter((i) => i.checked).reduce((sum, i) => sum + (i.score ?? 0), 0),
				checkedCount: items.filter((i) => i.checked).length
			};
		})
	);

	// ─── Init ─────────────────────────────────────────────────────────────────

	// Call on page load — seeds defaults, then overwrites with any saved DB data
	init(saved: EvaluationSectionItem[] = []) {
		if (saved.length > 0) {
			// Load from DB (editing an existing evaluation)
			this.sectionItems = saved;
		} else {
			// Fresh evaluation — pre-load all defaults, unchecked
			this.sectionItems = ALL_DEFAULT_ITEMS.map((item, idx) => ({
				id: -(idx + 1),            // temp negative IDs until saved to DB
				evaluation_id: 0,          // set by parent on submit
				section: item.section,
				item_key: item.item_key,
				item_label: item.item_label,
				checked: false,
				score: null,
				notes: null,
				created_at: null
			}));
		}
	}

	initBaristaTraining(saved: EvaluationBaristaTraining | null = null) {
		this.baristaTraining = saved ?? {
			id: -1,
			evaluation_id: 0,
			barista_name: null,
			score: null,
			needs_followup: false,
			followup_date: null,
			other_training: null,
			created_at: null,
			updated_at: null
		};
	}

	// ─── Section Items CRUD ───────────────────────────────────────────────────

	toggleChecked(id: number) {
		const item = this.sectionItems.find((i) => i.id === id);
		if (!item) return;
		item.checked = !item.checked;
		// Clear score when unchecking
		if (!item.checked) item.score = null;
	}

	updateItem(id: number, partial: EvaluationSectionItemUpdate) {
		const item = this.sectionItems.find((i) => i.id === id);
		if (!item) return;
		Object.assign(item, partial);
	}

	addItem(section: EvaluationSection, item_label: string) {
		const tempId = -(Date.now());
		this.sectionItems.push({
			id: tempId,
			evaluation_id: 0,
			section,
			item_key: `custom_${tempId}`,
			item_label,
			checked: true,              // custom items start checked
			score: null,
			notes: null,
			created_at: null
		});
	}

	removeItem(id: number) {
		this.sectionItems = this.sectionItems.filter((i) => i.id !== id);
	}

	// ─── Barista Training ─────────────────────────────────────────────────────

	updateBaristaTraining(partial: EvaluationBaristaTrainingUpdate) {
		if (!this.baristaTraining) return;
		Object.assign(this.baristaTraining, partial);
	}

	toggleFollowup() {
		if (!this.baristaTraining) return;
		this.baristaTraining.needs_followup = !this.baristaTraining.needs_followup;
		if (!this.baristaTraining.needs_followup) {
			this.baristaTraining.followup_date = null;
		}
	}

	// ─── Helpers ──────────────────────────────────────────────────────────────

	getSection(section: EvaluationSection): EvaluationSectionItem[] {
		return this.sectionItems.filter((i) => i.section === section);
	}

	getSectionMeta(section: EvaluationSection) {
		return SECTION_META[section];
	}

	// Only returns items that were actually checked — used on submit
	getCheckedItems(): EvaluationSectionItem[] {
		return this.sectionItems.filter((i) => i.checked);
	}

	clear() {
		this.sectionItems = [];
		this.baristaTraining = null;
	}
}

// ─── Context ──────────────────────────────────────────────────────────────────

export function setEvaluationSectionsContext(): EvaluationSectionsStore {
	const store = new EvaluationSectionsStore();
	setContext(EVALUATION_SECTIONS_KEY, store);
	return store;
}

export function getEvaluationSectionsContext(): EvaluationSectionsStore {
	return getContext(EVALUATION_SECTIONS_KEY);
}
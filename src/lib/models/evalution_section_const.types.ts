// ============================================
// Evaluation Checklist Constants
// TailorMade BO — Default items from PDF
// ============================================
// These are the default items pre-loaded on the
// evaluation page. The trainer can remove items
// they don't need or add custom ones.
// ============================================

export type EvaluationSection = 'cleanliness' | 'knowledge' | 'training';

export interface ChecklistItemDefault {
	item_key: string;
	item_label: string;
	section: EvaluationSection;
}

// ─── Section 4: Καθαριότητα ──────────────────────────────────────────────────

export const DEFAULT_CLEANLINESS_ITEMS: ChecklistItemDefault[] = [
	{
		section: 'cleanliness',
		item_key: 'coffee_post_clean',
		item_label: 'Πόστο καφέ καθαρό & οργανωμένο'
	},
	{
		section: 'cleanliness',
		item_key: 'espresso_machine_clean',
		item_label: 'Μηχανή espresso εξωτερικά καθαρή'
	},
	{
		section: 'cleanliness',
		item_key: 'machine_grate_clean',
		item_label: 'Σχάρα μηχανής καθαρή (και κάτω από αυτή)'
	},
	{
		section: 'cleanliness',
		item_key: 'groops_backflush',
		item_label: 'Groops backflush (έγινε ή γίνεται καθημερινά)'
	},
	{
		section: 'cleanliness',
		item_key: 'screen_showers_clean',
		item_label: 'Screen showers καθαρά'
	},
	{
		section: 'cleanliness',
		item_key: 'locks_clean',
		item_label: 'Κλείστρα καθαρά (χωρίς υπολείμματα καφέ)'
	},
	{
		section: 'cleanliness',
		item_key: 'grinders_clean',
		item_label: 'Μύλοι καθαροί'
	},
	{
		section: 'cleanliness',
		item_key: 'fridges_no_leaks',
		item_label: 'Ψυγεία/πάγκοι χωρίς διαρροές'
	},
	{
		section: 'cleanliness',
		item_key: 'rinser_clean',
		item_label: 'Rinser καθαρό'
	}
];

// ─── Section 5.1: Έλεγχος Γνώσεων ───────────────────────────────────────────

export const DEFAULT_KNOWLEDGE_ITEMS: ChecklistItemDefault[] = [
	{
		section: 'knowledge',
		item_key: 'knows_dose_in_out',
		item_label: 'Γνωρίζει σωστό dose in/out'
	},
	{
		section: 'knowledge',
		item_key: 'knows_extraction_time',
		item_label: 'Γνωρίζει σωστό χρόνο εκχύλισης'
	},
	{
		section: 'knowledge',
		item_key: 'knows_milk_temp',
		item_label: 'Γνωρίζει σωστή θερμοκρασία γάλακτος'
	},
	{
		section: 'knowledge',
		item_key: 'correct_tamping',
		item_label: 'Κάνει σωστό tamping'
	},
	{
		section: 'knowledge',
		item_key: 'uses_distributor',
		item_label: 'Χρησιμοποιεί distributor'
	},
	{
		section: 'knowledge',
		item_key: 'weighs_coffee',
		item_label: 'Ζυγίζει τον καφέ'
	},
	{
		section: 'knowledge',
		item_key: 'knows_closing_cleaning',
		item_label: 'Γνωρίζει διαδικασία καθαρισμού κλεισίματος'
	},
	{
		section: 'knowledge',
		item_key: 'knows_grinder_calibration',
		item_label: 'Γνωρίζει calibration μύλου'
	}
];

// ─── Section 5.2: Εκπαίδευση που έγινε ──────────────────────────────────────

export const DEFAULT_TRAINING_ITEMS: ChecklistItemDefault[] = [
	{
		section: 'training',
		item_key: 'trained_scale_use',
		item_label: 'Σωστή χρήση ζυγαριάς'
	},
	{
		section: 'training',
		item_key: 'trained_distributor',
		item_label: 'Σωστή χρήση distributor'
	},
	{
		section: 'training',
		item_key: 'trained_grinder_calibration',
		item_label: 'Calibration μύλου'
	},
	{
		section: 'training',
		item_key: 'trained_closing_cleaning',
		item_label: 'Διαδικασία καθαρισμού κλεισίματος'
	},
	{
		section: 'training',
		item_key: 'trained_milk_foam_art',
		item_label: 'Αφρόγαλα & latte art basics'
	},
	{
		section: 'training',
		item_key: 'trained_backflush',
		item_label: 'Backflush διαδικασία'
	}
];

// ─── All sections combined ────────────────────────────────────────────────────

export const ALL_DEFAULT_ITEMS: ChecklistItemDefault[] = [
	...DEFAULT_CLEANLINESS_ITEMS,
	...DEFAULT_KNOWLEDGE_ITEMS,
	...DEFAULT_TRAINING_ITEMS
];

// ─── Section metadata ─────────────────────────────────────────────────────────
// Used for rendering section headers and labels in the UI

export const SECTION_META: Record<EvaluationSection, { label: string; description: string }> = {
	cleanliness: {
		label: 'Καθαριότητα',
		description: 'Έλεγχος καθαριότητας πόστου & εξοπλισμού'
	},
	knowledge: {
		label: 'Έλεγχος Γνώσεων Barista',
		description: 'Τι γνωρίζει ο barista'
	},
	training: {
		label: 'Εκπαίδευση που έγινε',
		description: 'Τι εκπαιδεύτηκε κατά την επίσκεψη'
	}
};
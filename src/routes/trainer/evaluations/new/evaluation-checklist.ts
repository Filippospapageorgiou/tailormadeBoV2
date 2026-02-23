// ============================================
// Evaluation Checklist Configuration
// Maps the Venetis Quality Control PDF form
// to structured data for the evaluation system
// ============================================

import type { EvaluationSectionKey } from '$lib/models/trainers.types';

// ---------- Section Definitions ----------

export interface CheckItemDef {
	key: string;
	label: string;
	type: 'checkbox' | 'text' | 'number' | 'select';
	/** For select type */
	options?: { value: string; label: string }[];
	/** Placeholder or hint */
	hint?: string;
}

export interface GrinderRowDef {
	key: string;
	label: string;
	fields: {
		key: string;
		label: string;
		type: 'number' | 'text';
		hint?: string;
		unit?: string;
	}[];
}

export interface PhotoSlotDef {
	key: string;
	label: string;
	description: string;
}

export interface SectionDef {
	key: EvaluationSectionKey;
	number: number;
	title: string;
	titleEn: string;
	icon: string; // lucide icon name
	description: string;
	checkItems?: CheckItemDef[];
	/** For grinder calibration table */
	grinderRows?: GrinderRowDef[];
	/** For photo section */
	photoSlots?: PhotoSlotDef[];
	/** Whether this section has a rating */
	hasRating: boolean;
	/** Custom rating options (instead of 1-5) */
	ratingOptions?: { value: string; label: string; score: number }[];
}

// ---------- Section 1: Espresso Machine ----------

const espressoMachineSection: SectionDef = {
	key: 'espresso_machine',
	number: 1,
	title: 'Μηχανή Espresso',
	titleEn: 'Espresso Machine',
	icon: 'Coffee',
	description: 'Ρυθμίσεις, κατάσταση μηχανής & παράμετροι εκχύλισης',
	hasRating: true,
	checkItems: [
		{ key: 'screen_ok', label: 'Οθόνη λειτουργεί κανονικά', type: 'checkbox' },
		{
			key: 'steam_wand_ok',
			label: 'Ακροφύσιο ατμού OK (δεν στάζει/δεν βγάζει ατμό κλειστό)',
			type: 'checkbox'
		},
		{ key: 'groups_ok', label: 'Groops σε καλή κατάσταση', type: 'checkbox' },
		{ key: 'screen_showers_clean', label: 'Screen showers καθαρά', type: 'checkbox' },
		{
			key: 'portafilters_ok',
			label: 'Κλείστρα (portafilters) καθαρά & σε καλή κατάσταση',
			type: 'checkbox'
		},
		{
			key: 'gaskets_ok',
			label: 'Λάστιχα groops OK (δεν χρειάζονται αλλαγή)',
			type: 'checkbox'
		},
		{ key: 'rinser_ok', label: 'Rinser λειτουργεί κανονικά', type: 'checkbox' },
		{ key: 'no_water_leak', label: 'Δεν υπάρχει διαρροή νερού', type: 'checkbox' }
	]
};

// ---------- Section 2: Grinders ----------

const grindersSection: SectionDef = {
	key: 'grinders',
	number: 2,
	title: 'Μύλοι Άλεσης',
	titleEn: 'Grinders',
	icon: 'Disc3',
	description: 'Calibration, ρυθμίσεις & κατάσταση μύλων',
	hasRating: true,
	grinderRows: [
		{
			key: 'grinder_1',
			label: 'Μύλος 1 (Κλασικός)',
			fields: [
				{ key: 'dose_in', label: 'Dose In', type: 'number', hint: '18-19', unit: 'g' },
				{ key: 'dose_out', label: 'Dose Out', type: 'number', hint: '54-60', unit: 'g' },
				{ key: 'time', label: 'Χρόνος', type: 'number', hint: '25-30', unit: 'sec' },
				{ key: 'type', label: 'Τύπος', type: 'text', hint: 'On Demand / Δοσομετρικός' }
			]
		},
		{
			key: 'grinder_2',
			label: 'Μύλος 2 (Organic)',
			fields: [
				{ key: 'dose_in', label: 'Dose In', type: 'number', hint: '18-19', unit: 'g' },
				{ key: 'dose_out', label: 'Dose Out', type: 'number', hint: '54-60', unit: 'g' },
				{ key: 'time', label: 'Χρόνος', type: 'number', hint: '25-30', unit: 'sec' },
				{ key: 'type', label: 'Τύπος', type: 'text', hint: 'On Demand / Δοσομετρικός' }
			]
		},
		{
			key: 'grinder_3',
			label: 'Μύλος 3 (Decaf)',
			fields: [
				{ key: 'dose_in', label: 'Dose In', type: 'number', hint: '18-19', unit: 'g' },
				{ key: 'dose_out', label: 'Dose Out', type: 'number', hint: '54-60', unit: 'g' },
				{ key: 'time', label: 'Χρόνος', type: 'number', hint: '25-30', unit: 'sec' },
				{ key: 'type', label: 'Τύπος', type: 'text', hint: 'On Demand / Δοσομετρικός' }
			]
		}
	],
	checkItems: [
		{ key: 'grinders_clean', label: 'Μύλοι καθαροί (χωρίς υπολείμματα)', type: 'checkbox' },
		{
			key: 'hopper_clean',
			label: 'Hopper καθαρό (χωρίς έλαια/κιτρίνισμα)',
			type: 'checkbox'
		},
		{ key: 'burrs_ok', label: 'Μαχαίρια σε καλή κατάσταση', type: 'checkbox' },
		{
			key: 'grinder_type',
			label: 'Τύπος μύλου',
			type: 'select',
			options: [
				{ value: 'on_demand', label: 'On Demand' },
				{ value: 'dosimetric', label: 'Δοσομετρικός (προτείνεται αλλαγή)' }
			]
		}
	]
};

// ---------- Section 3: Equipment & Consumables ----------

const equipmentConsumablesSection: SectionDef = {
	key: 'equipment_consumables',
	number: 3,
	title: 'Εξοπλισμός & Αναλώσιμα',
	titleEn: 'Equipment & Consumables',
	icon: 'Wrench',
	description: 'Εργαλεία barista, μηχανές & φίλτρο νερού',
	hasRating: true,
	checkItems: [
		// 3.1 Barista Tools
		{ key: 'scale_exists', label: 'Ζυγαριά (υπάρχει & χρησιμοποιείται)', type: 'checkbox' },
		{ key: 'distributor', label: 'Distributor/Leveler', type: 'checkbox' },
		{ key: 'electronic_tamper', label: 'Ηλεκτρονικό Tamper / Puq Press', type: 'checkbox' },
		{ key: 'tamping_mat', label: 'Tamping Mat', type: 'checkbox' },
		{
			key: 'manual_tamper',
			label: 'Tamper χειροκίνητο (σωστή διάμετρος)',
			type: 'checkbox'
		},
		{ key: 'group_brush', label: 'Βουρτσάκι καθαρισμού groops', type: 'checkbox' },
		{ key: 'milk_pitchers_ok', label: 'Γαλατιέρες σε καλή κατάσταση', type: 'checkbox' },
		{ key: 'knock_box_ok', label: 'Knock box σε καλή κατάσταση', type: 'checkbox' },
		// 3.2 Machines
		{
			key: 'filter_coffee_machine',
			label: 'Μηχανή καφέ φίλτρου (υπάρχει & λειτουργεί)',
			type: 'checkbox'
		},
		{
			key: 'greek_coffee_machine',
			label: 'Μηχανή ελληνικού καφέ (υπάρχει & λειτουργεί)',
			type: 'checkbox'
		},
		{ key: 'mixer_ok', label: 'Mixer σε καλή κατάσταση', type: 'checkbox' },
		{ key: 'mixer_blades_ok', label: 'Πεταλούδες mixer OK', type: 'checkbox' },
		{ key: 'ice_machine_ok', label: 'Παγομηχανή λειτουργεί', type: 'checkbox' }
	]
};

// ---------- Section 4: Cleanliness ----------

const cleanlinessSection: SectionDef = {
	key: 'cleanliness',
	number: 4,
	title: 'Καθαριότητα',
	titleEn: 'Cleanliness',
	icon: 'Sparkles',
	description: 'Καθαριότητα πόστου, μηχανής & εξοπλισμού',
	hasRating: true,
	ratingOptions: [
		{ value: 'excellent', label: 'Άριστη', score: 5 },
		{ value: 'good', label: 'Καλή', score: 4 },
		{ value: 'average', label: 'Μέτρια', score: 3 },
		{ value: 'poor', label: 'Κακή', score: 1 }
	],
	checkItems: [
		{ key: 'station_clean', label: 'Πόστο καφέ καθαρό & οργανωμένο', type: 'checkbox' },
		{ key: 'machine_exterior_clean', label: 'Μηχανή espresso εξωτερικά καθαρή', type: 'checkbox' },
		{
			key: 'drip_tray_clean',
			label: 'Σχάρα μηχανής καθαρή (και κάτω από αυτή)',
			type: 'checkbox'
		},
		{
			key: 'backflush_done',
			label: 'Groops backflush (έγινε ή γίνεται καθημερινά)',
			type: 'checkbox'
		},
		{ key: 'showers_clean', label: 'Screen showers καθαρά', type: 'checkbox' },
		{
			key: 'portafilters_clean',
			label: 'Κλείστρα καθαρά (χωρίς υπολείμματα καφέ)',
			type: 'checkbox'
		},
		{ key: 'grinders_clean', label: 'Μύλοι καθαροί', type: 'checkbox' },
		{ key: 'fridge_counters_ok', label: 'Ψυγεία/πάγκοι χωρίς διαρροές', type: 'checkbox' },
		{ key: 'rinser_clean', label: 'Rinser καθαρό', type: 'checkbox' }
	]
};

// ---------- Section 5: Barista Training ----------

const baristaTrainingSection: SectionDef = {
	key: 'barista_training',
	number: 5,
	title: 'Μικρο-Εκπαίδευση Barista',
	titleEn: 'Barista Training',
	icon: 'GraduationCap',
	description: 'Έλεγχος γνώσεων & εκπαίδευση που πραγματοποιήθηκε',
	hasRating: true,
	checkItems: [
		// 5.1 Knowledge Check
		{ key: 'knows_dose', label: 'Γνωρίζει σωστό dose in/out', type: 'checkbox' },
		{ key: 'knows_extraction_time', label: 'Γνωρίζει σωστό χρόνο εκχύλισης', type: 'checkbox' },
		{ key: 'knows_milk_temp', label: 'Γνωρίζει σωστή θερμοκρασία γάλακτος', type: 'checkbox' },
		{ key: 'correct_tamping', label: 'Κάνει σωστό tamping', type: 'checkbox' },
		{ key: 'uses_distributor', label: 'Χρησιμοποιεί distributor', type: 'checkbox' },
		{ key: 'weighs_coffee', label: 'Ζυγίζει τον καφέ', type: 'checkbox' },
		{
			key: 'knows_closing_procedure',
			label: 'Γνωρίζει διαδικασία καθαρισμού κλεισίματος',
			type: 'checkbox'
		},
		{ key: 'knows_calibration', label: 'Γνωρίζει calibration μύλου', type: 'checkbox' },
		// 5.2 Training Done
		{ key: 'trained_scale', label: '✎ Σωστή χρήση ζυγαριάς', type: 'checkbox' },
		{ key: 'trained_distributor', label: '✎ Σωστή χρήση distributor', type: 'checkbox' },
		{ key: 'trained_calibration', label: '✎ Calibration μύλου', type: 'checkbox' },
		{
			key: 'trained_closing',
			label: '✎ Διαδικασία καθαρισμού κλεισίματος',
			type: 'checkbox'
		},
		{ key: 'trained_latte_art', label: '✎ Αφρόγαλα & latte art basics', type: 'checkbox' },
		{ key: 'trained_backflush', label: '✎ Backflush διαδικασία', type: 'checkbox' },
		{ key: 'trained_other', label: '✎ Άλλο', type: 'text', hint: 'Περιγράψτε...' }
	]
};

// ---------- Section 6: Photo Documentation ----------

const photoDocumentationSection: SectionDef = {
	key: 'photo_documentation',
	number: 6,
	title: 'Φωτογραφική Τεκμηρίωση',
	titleEn: 'Photo Documentation',
	icon: 'Camera',
	description: 'Φωτογραφίες εξοπλισμού, κατάστασης & προβλημάτων',
	hasRating: false,
	photoSlots: [
		{ key: 'coffee_station', label: 'Πόστο Καφέ', description: 'Γενική εικόνα' },
		{
			key: 'espresso_machine',
			label: 'Μηχανή Espresso',
			description: 'Μοντέλο/κατάσταση'
		},
		{
			key: 'machine_screen',
			label: 'Οθόνη Μηχανής',
			description: 'Θερμοκρασία/πίεση'
		},
		{ key: 'groups_showers', label: 'Groops/Showers', description: 'Καθαριότητα' },
		{ key: 'portafilters', label: 'Κλείστρα', description: 'Portafilters' },
		{ key: 'grinders', label: 'Μύλοι', description: 'Καθαριότητα/τύπος' },
		{ key: 'hopper', label: 'Hopper Μύλου', description: 'Έλαια/καθαριότητα' },
		{ key: 'water_filter', label: 'Φίλτρο Νερού', description: 'Ετικέτα ημ/νίας' },
		{
			key: 'tools',
			label: 'Εργαλεία',
			description: 'Ζυγαριά/tamper/distributor'
		},
		{ key: 'problem_1', label: 'Πρόβλημα #1', description: 'Περιγραφή κάτω' },
		{ key: 'problem_2', label: 'Πρόβλημα #2', description: 'Περιγραφή κάτω' },
		{ key: 'problem_3', label: 'Πρόβλημα #3', description: 'Περιγραφή κάτω' }
	]
};

// ---------- Section 7: Summary & Actions ----------

const summaryActionsSection: SectionDef = {
	key: 'summary_actions',
	number: 7,
	title: 'Σύνοψη & Ενέργειες',
	titleEn: 'Summary & Actions',
	icon: 'ListChecks',
	description: 'Άμεσες ανάγκες, ενέργειες & συνολική βαθμολογία',
	hasRating: false // Overall rating is separate
};

// ---------- Export all sections ----------

export const EVALUATION_SECTIONS: SectionDef[] = [
	espressoMachineSection,
	grindersSection,
	equipmentConsumablesSection,
	cleanlinessSection,
	baristaTrainingSection,
	photoDocumentationSection,
	summaryActionsSection
];

/** Quick lookup by key */
export const SECTION_MAP = Object.fromEntries(
	EVALUATION_SECTIONS.map((s) => [s.key, s])
) as Record<EvaluationSectionKey, SectionDef>;

/** Section keys that contribute to the radar chart (those with ratings) */
export const RATED_SECTION_KEYS = EVALUATION_SECTIONS.filter((s) => s.hasRating).map(
	(s) => s.key
);

/** Target values for grinder calibration */
export const GRINDER_TARGETS = {
	doseIn: { min: 18, max: 19, unit: 'g' },
	doseOut: { min: 54, max: 60, unit: 'g' },
	time: { min: 25, max: 30, unit: 'sec' }
} as const;

/** Machine target values */
export const MACHINE_TARGETS = {
	temperature: { target: 94, unit: '°C' },
	pressure: { target: 9, unit: 'bar' }
} as const;
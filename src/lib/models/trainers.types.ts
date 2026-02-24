// ============================================
// Trainer & Store Evaluation Types
// TailorMade BO
// ============================================

// ---------- Enums / Literals ----------
import type { EvaluationSection } from "./evalution_section_const.types";


export type EvaluationStatus = "draft" | "submitted" | "reviewed" | "reopened";
// ---------- Trainer Org Assignments ----------

export interface TrainerOrgAssignment {
  id: number;
  trainer_id: string; // uuid
  org_id: number;
  assigned_by: string; // uuid
  is_active: boolean;
  created_at: string;
  updated_at: string;
  visit_date: string;
}

export interface TrainerOrgAssignmentInsert {
  trainer_id: string;
  org_id: number;
  assigned_by: string;
  is_active?: boolean;
}

export interface TrainerOrgAssignmentUpdate {
  is_active?: boolean;
  updated_at?: string;
}

// ---------- Store Evaluations ----------

export interface StoreEvaluation {
  id: number;
  org_id: number;
  trainer_id: string;
  visit_date: string; // date
  store_managers: string[]; // uuid[]
  baristas_on_duty: string[]; // uuid[]
  submit : EvaluationStatus;
  overall_rating: number | null;
  overall_comments: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreEvaluationInsert {
  org_id: number;
  trainer_id: string;
  visit_date?: string;
  store_managers?: string[];
  baristas_on_duty?: string[];
  status?: EvaluationStatus;
  overall_rating?: number | null;
  overall_comments?: string | null;
}

export interface StoreEvaluationUpdate {
  store_managers?: string[];
  baristas_on_duty?: string[];
  status?: EvaluationStatus;
  overall_rating?: number | null;
  overall_comments?: string | null;
  admin_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  submitted_at?: string | null;
  updated_at?: string;
}


// ---------- Evaluation Machine Data ----------

// ─── Equipment Evaluation ────────────────────────────────────────────────────
// One record per piece of equipment within a store evaluation.
// Holds the overall score and notes for that equipment.

export interface EquipmentEvaluation {
  id: number
  evaluation_id: number       // FK → store_evaluations.id
  equipment_id: number | null // FK → equipment.id
  score: number | null
  notes: string | null
  created_at: string | null
}


// ─── Equipment Check Item ─────────────────────────────────────────────────────
// Many detail rows per equipment evaluation.
// Each row represents a single check point the trainer evaluated.

export interface EquipmentCheckItem {
  id: number
  equipment_eval_id: number   // FK → equipment_evaluations.id
  check_name: string
  value_text: string | null
  value_numeric: number | null
  passed: boolean | null
  notes: string | null
  created_at: string | null
}

export interface EquipmentEvaluationWithChecks extends EquipmentEvaluation {
  equipment_check_items: EquipmentCheckItem[]
}


export interface EvaluationSectionItem {
	id: number
	evaluation_id: number        // FK → store_evaluations.id
	section: EvaluationSection   // 'cleanliness' | 'knowledge' | 'training'
	item_key: string             // stable identifier e.g. 'coffee_post_clean'
	item_label: string           // display label (can be edited by trainer)
	checked: boolean             // did the trainer evaluate this item
	score: number | null         // score for this item
	notes: string | null
	created_at: string | null
}

export interface EvaluationSectionItemInsert {
	evaluation_id: number
	section: EvaluationSection
	item_key: string
	item_label: string
	checked?: boolean
	score?: number | null
	notes?: string | null
}

export interface EvaluationSectionItemUpdate {
	item_label?: string
	checked?: boolean
	score?: number | null
	notes?: string | null
}

// ─── Evaluation Barista Training ──────────────────────────────────────────────
// One row per evaluation (UNIQUE on evaluation_id).
// Covers section 5.2 — training done + barista info.

export interface EvaluationBaristaTraining {
	id: number
	evaluation_id: number        // FK → store_evaluations.id (unique)
	barista_name: string | null
	score: number | null
	needs_followup: boolean
	followup_date: string | null // date string 'YYYY-MM-DD'
	other_training: string | null
	created_at: string | null
	updated_at: string | null
}

export interface EvaluationBaristaTrainingInsert {
	evaluation_id: number
	barista_name?: string | null
	score?: number | null
	needs_followup?: boolean
	followup_date?: string | null
	other_training?: string | null
}

export interface EvaluationBaristaTrainingUpdate {
	barista_name?: string | null
	score?: number | null
	needs_followup?: boolean
	followup_date?: string | null
	other_training?: string | null
}

// ─── Grouped helper type ──────────────────────────────────────────────────────
// Useful when reading back a full evaluation with all section items grouped.

export interface EvaluationSectionGroup {
	section: EvaluationSection
	items: EvaluationSectionItem[]
	totalScore: number
	checkedCount: number
}



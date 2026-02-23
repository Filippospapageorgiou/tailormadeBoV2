// ============================================
// Trainer & Store Evaluation Types
// TailorMade BO
// ============================================

// ---------- Enums / Literals ----------

export type EvaluationStatus = "draft" | "submitted" | "reviewed" | "reopened";

export type ActionCategory =
  | "equipment"
  | "technical_service"
  | "training"
  | "general";

export type ActionPriority = "low" | "medium" | "high" | "critical";

export type EvaluationSectionKey =
  | "espresso_machine"
  | "grinders"
  | "equipment_consumables"
  | "cleanliness"
  | "barista_training"
  | "photo_documentation"
  | "summary_actions";

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

// ---------- Evaluation Sections ----------

export interface EvaluationSection {
  id: number;
  evaluation_id: number;
  section_key: EvaluationSectionKey;
  rating: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluationSectionInsert {
  evaluation_id: number;
  section_key: EvaluationSectionKey;
  rating?: string | null;
  notes?: string | null;
}

export interface EvaluationSectionUpdate {
  rating?: string | null;
  notes?: string | null;
  updated_at?: string;
}

// ---------- Evaluation Check Items ----------

export interface EvaluationCheckItem {
  id: number;
  evaluation_id: number;
  section_key: EvaluationSectionKey;
  item_key: string;
  checked: boolean;
  value_text: string | null;
  value_numeric: number | null;
  notes: string | null;
  created_at: string;
}

export interface EvaluationCheckItemInsert {
  evaluation_id: number;
  section_key: EvaluationSectionKey;
  item_key: string;
  checked?: boolean;
  value_text?: string | null;
  value_numeric?: number | null;
  notes?: string | null;
}

export interface EvaluationCheckItemUpdate {
  checked?: boolean;
  value_text?: string | null;
  value_numeric?: number | null;
  notes?: string | null;
}

// ---------- Evaluation Machine Data ----------

export interface EvaluationMachineData {
  id: number;
  evaluation_id: number;
  equipment_id: number | null;
  checked: boolean;
  value_text: string | null;
  value_numeric: number | null;
  notes: string | null;
  created_at: string;
}

export interface EvaluationMachineDataInsert {
  evaluation_id: number;
  equipment_id?: number | null;
  checked?: boolean;
  value_text?: string | null;
  value_numeric?: number | null;
  notes?: string | null;
}

export interface EvaluationMachineDataUpdate {
  equipment_id?: number | null;
  checked?: boolean;
  value_text?: string | null;
  value_numeric?: number | null;
  notes?: string | null;
}

// ---------- Evaluation Photos ----------

export interface EvaluationPhoto {
  id: number;
  evaluation_id: number;
  section_key: EvaluationSectionKey;
  photo_url: string;
  photo_label: string | null;
  caption: string | null;
  display_order: number;
  created_at: string;
}

export interface EvaluationPhotoInsert {
  evaluation_id: number;
  section_key: EvaluationSectionKey;
  photo_url: string;
  photo_label?: string | null;
  caption?: string | null;
  display_order?: number;
}

export interface EvaluationPhotoUpdate {
  photo_label?: string | null;
  caption?: string | null;
  display_order?: number;
}

// ---------- Evaluation Action Items ----------

export interface EvaluationActionItem {
  id: number;
  evaluation_id: number;
  category: ActionCategory;
  description: string;
  priority: ActionPriority;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface EvaluationActionItemInsert {
  evaluation_id: number;
  category: ActionCategory;
  description: string;
  priority?: ActionPriority;
}

export interface EvaluationActionItemUpdate {
  category?: ActionCategory;
  description?: string;
  priority?: ActionPriority;
  resolved?: boolean;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

// ---------- Evaluation Water Filter ----------

export interface EvaluationWaterFilter {
  id: number;
  evaluation_id: number;
  last_change_date: string | null; // date
  filter_type: string | null;
  supplier: string | null;
  needs_replacement: boolean;
  created_at: string;
}

export interface EvaluationWaterFilterInsert {
  evaluation_id: number;
  last_change_date?: string | null;
  filter_type?: string | null;
  supplier?: string | null;
  needs_replacement?: boolean;
}

export interface EvaluationWaterFilterUpdate {
  last_change_date?: string | null;
  filter_type?: string | null;
  supplier?: string | null;
  needs_replacement?: boolean;
}

// ---------- Joined / Expanded Types ----------

/** Full evaluation with all child data loaded */
export interface StoreEvaluationFull extends StoreEvaluation {
  sections: EvaluationSection[];
  check_items: EvaluationCheckItem[];
  machine_data: EvaluationMachineData[];
  photos: EvaluationPhoto[];
  action_items: EvaluationActionItem[];
  water_filter: EvaluationWaterFilter | null;
  // Expanded references
  organization?: { id: number; store_name: string };
  trainer?: { id: string; username: string; full_name: string | null };
}

/** Storage path helper */
export const getEvaluationPhotoPath = (
  orgId: number,
  evaluationId: number,
  sectionKey: EvaluationSectionKey,
  fileName: string
): string => `${orgId}/${evaluationId}/${sectionKey}/${fileName}`;
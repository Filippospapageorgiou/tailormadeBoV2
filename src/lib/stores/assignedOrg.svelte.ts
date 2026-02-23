import { getContext, setContext } from "svelte";
import type { TrainerOrgAssignment } from "$lib/models/trainers.types";

const TRAINER_ORG_ASSIGNMENT_KEY = Symbol('trainer_assignment');

export class TrainerAssignmentOrgClass {
    id = $state(0);
    trainer_id = $state('');
    org_id = $state(0);
    assigned_by = $state('');
    is_active = $state(false);
    created_at = $state('');
    updated_at = $state('');
    visit_date = $state('');

    // Derived state
    readonly isAssigned = $derived(this.id > 0 && this.trainer_id !== '');
    readonly isValid = $derived(this.trainer_id !== '' && this.org_id > 0);
    readonly hasVisitDate = $derived(this.visit_date !== '');
    readonly daysSinceAssignment = $derived(() => {
        if (!this.created_at) return null;
        const created = new Date(this.created_at);
        const now = new Date();
        return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    });

    constructor(assignment: TrainerOrgAssignment | null) {
        if (assignment) {
            this.setTrainerAssignmentOrg(assignment);
        }
    }

    setTrainerAssignmentOrg(assignment: TrainerOrgAssignment | null) {
        if (assignment) {
            this.id = assignment.id;
            this.trainer_id = assignment.trainer_id;
            this.org_id = assignment.org_id;
            this.assigned_by = assignment.assigned_by;
            this.is_active = assignment.is_active;
            this.created_at = assignment.created_at;
            this.updated_at = assignment.updated_at;
            this.visit_date = assignment.visit_date;
        }
    }

    // Individual field update methods
    updateTrainerId(trainer_id: string) {
        this.trainer_id = trainer_id;
        this.touchUpdatedAt();
    }

    updateOrgId(org_id: number) {
        this.org_id = org_id;
        this.touchUpdatedAt();
    }

    updateAssignedBy(assigned_by: string) {
        this.assigned_by = assigned_by;
        this.touchUpdatedAt();
    }

    updateVisitDate(visit_date: string) {
        this.visit_date = visit_date;
        this.touchUpdatedAt();
    }

    activate() {
        this.is_active = true;
        this.touchUpdatedAt();
    }

    deactivate() {
        this.is_active = false;
        this.touchUpdatedAt();
    }

    toggleActive() {
        this.is_active = !this.is_active;
        this.touchUpdatedAt();
    }

    // Partial update — only updates provided fields
    updatePartial(partial: Partial<TrainerOrgAssignment>) {
        if (partial.id !== undefined) this.id = partial.id;
        if (partial.trainer_id !== undefined) this.trainer_id = partial.trainer_id;
        if (partial.org_id !== undefined) this.org_id = partial.org_id;
        if (partial.assigned_by !== undefined) this.assigned_by = partial.assigned_by;
        if (partial.is_active !== undefined) this.is_active = partial.is_active;
        if (partial.created_at !== undefined) this.created_at = partial.created_at;
        if (partial.updated_at !== undefined) this.updated_at = partial.updated_at;
        if (partial.visit_date !== undefined) this.visit_date = partial.visit_date;
    }

    // Snapshot to plain object (useful for API calls, serialization)
    toJSON(): TrainerOrgAssignment {
        return {
            id: this.id,
            trainer_id: this.trainer_id,
            org_id: this.org_id,
            assigned_by: this.assigned_by,
            is_active: this.is_active,
            created_at: this.created_at,
            updated_at: this.updated_at,
            visit_date: this.visit_date,
        };
    }

    // Clone current state into a new plain object (useful for undo/diff)
    snapshot(): TrainerOrgAssignment {
        return structuredClone(this.toJSON());
    }

    // Check equality with another assignment
    equals(other: TrainerOrgAssignment | null): boolean {
        if (!other) return false;
        return (
            this.id === other.id &&
            this.trainer_id === other.trainer_id &&
            this.org_id === other.org_id &&
            this.assigned_by === other.assigned_by &&
            this.is_active === other.is_active &&
            this.visit_date === other.visit_date
        );
    }

    // Check if any field has changed compared to a reference
    hasChanges(original: TrainerOrgAssignment): boolean {
        return !this.equals(original);
    }

    clear() {
        this.id = 0;
        this.trainer_id = '';
        this.org_id = 0;
        this.assigned_by = '';
        this.is_active = false;
        this.created_at = '';
        this.updated_at = '';
        this.visit_date = '';
    }

    // Private helper
    private touchUpdatedAt() {
        this.updated_at = new Date().toISOString();
    }
}

// Global store instance for use outside of components (like in login)
let trainerAssignmentStore: TrainerAssignmentOrgClass | null = null;

export function setAssignmentStore(assignment: TrainerOrgAssignment | null): TrainerAssignmentOrgClass {
    const store = new TrainerAssignmentOrgClass(assignment);
    setContext(TRAINER_ORG_ASSIGNMENT_KEY, store);
    trainerAssignmentStore = store;
    return store;
}

export function getAssignmentStore(): TrainerAssignmentOrgClass {
    return getContext(TRAINER_ORG_ASSIGNMENT_KEY);
}

// Access the global store outside component tree
export function getGlobalAssignmentStore(): TrainerAssignmentOrgClass | null {
    return trainerAssignmentStore;
}

// Reset the global store
export function clearGlobalAssignmentStore() {
    trainerAssignmentStore?.clear();
    trainerAssignmentStore = null;
}
export const SCHEDULE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
} as const;

export const SHIFT_TYPE = {
  WORK: 'work',
  DAY_OFF: 'day_off',
  SICK_LEAVE: 'sick_leave',
  VACATION: 'vacation'
} as const;

export const SHIFT_CATEGORY = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night'
} as const;

export const REQUEST_TYPE = {
  CHANGE: 'change',
  SWAP: 'swap',
  CANCEL: 'cancel'
} as const;

export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
} as const;

export type ScheduleStatus = typeof SCHEDULE_STATUS[keyof typeof SCHEDULE_STATUS];
export type ShiftType = typeof SHIFT_TYPE[keyof typeof SHIFT_TYPE];
export type ShiftCategory = typeof SHIFT_CATEGORY[keyof typeof SHIFT_CATEGORY];
export type RequestType = typeof REQUEST_TYPE[keyof typeof REQUEST_TYPE];
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

export interface WeeklySchedule {
    id:number;
    org_id: number;

    //week definition
    week_start_date:string; // Date as ISO string 'YYYY-MM-DD'
    week_end_date:string
    year:number;

    //Status
    status:ScheduleStatus

    // Metadata
    created_by: string; // UUID
    published_by: string | null;
    published_at: string | null; // ISO timestamp
  
    created_at: string; // ISO timestamp
    updated_at: string;
}

/**
 * Shift - Μία βάρδια
 */
export interface Shift {
  id: number;
  org_id: number;
  schedule_id: number;
  user_id: string; // UUID
  
  // Shift timing
  shift_date: string; // 'YYYY-MM-DD'
  start_time: string | null; // 'HH:MM:SS' or null for day_off
  end_time: string | null;
  
  // Shift type
  shift_type: ShiftType;
  shift_category: ShiftCategory | null;
  
  // Break time
  break_duration_minutes: number;
  
  // Metadata
  notes: string | null;
  created_by: string | null; // UUID
  created_at: string;
  updated_at: string;
}

/**
 * Shift Change Request - Αίτημα αλλαγής βάρδιας
 */
export interface ShiftChangeRequest {
  id: number;
  org_id: number;
  shift_id: number;
  requested_by: string; // UUID
  
  // Request type
  request_type: RequestType;
  swap_with_user_id: string | null; // UUID
  swap_with_shift_id: number | null;
  
  // Proposed changes
  proposed_date: string | null; // 'YYYY-MM-DD'
  proposed_start_time: string | null; // 'HH:MM:SS'
  proposed_end_time: string | null;
  reason: string | null;
  
  // Status
  status: RequestStatus;
  reviewed_by: string | null; // UUID
  reviewed_at: string | null;
  admin_notes: string | null;
  
  created_at: string;
  updated_at: string;
}
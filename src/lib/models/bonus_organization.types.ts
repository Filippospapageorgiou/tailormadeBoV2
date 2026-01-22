// =============================================
// BONUS SYSTEM - TypeScript Interfaces
// =============================================

// ---------------------------------------------
// BONUS PERIODS
// ---------------------------------------------
export interface BonusPeriod {
  id: number;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  comparison_quarter: 1 | 2 | 3 | 4;
  comparison_year: number;
  network_average_percentage: number;
  status: 'draft' | 'published';
  created_by: string; // uuid
  published_by: string | null; // uuid
  published_at: string | null; // timestamptz
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface BonusPeriodInsert {
  quarter: 1 | 2 | 3 | 4;
  year: number;
  comparison_quarter: 1 | 2 | 3 | 4;
  comparison_year: number;
  network_average_percentage?: number;
  status?: 'draft' | 'published';
  created_by: string;
  published_by?: string | null;
  published_at?: string | null;
}

export interface BonusPeriodUpdate {
  quarter?: 1 | 2 | 3 | 4;
  year?: number;
  comparison_quarter?: 1 | 2 | 3 | 4;
  comparison_year?: number;
  network_average_percentage?: number;
  status?: 'draft' | 'published';
  published_by?: string | null;
  published_at?: string | null;
  updated_at?: string;
}

// ---------------------------------------------
// BONUS ORGANIZATION DATA
// ---------------------------------------------
export interface BonusOrganizationData {
  id: number;
  period_id: number;
  org_id: number;
  current_kilos: number;
  previous_kilos: number;
  kilo_difference: number; // generated
  percentage_change: number; // generated
  above_network_average: boolean;
  base_bonus: number;
  multiplier: number;
  final_bonus: number;
  total_bonus_pool: number;
  total_hours_worked: number;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface BonusOrganizationDataInsert {
  period_id: number;
  org_id: number;
  current_kilos: number;
  previous_kilos: number;
  above_network_average?: boolean;
  base_bonus?: number;
  multiplier?: number;
  final_bonus?: number;
  morning_pool?: number;
  afternoon_pool?: number;
}

export interface BonusOrganizationDataUpdate {
  current_kilos?: number;
  previous_kilos?: number;
  above_network_average?: boolean;
  base_bonus?: number;
  multiplier?: number;
  final_bonus?: number;
  morning_pool?: number;
  afternoon_pool?: number;
  updated_at?: string;
}



export interface BonusEmployeePayout {
  id: number;
  org_data_id: number;
  user_id: string; // uuid
  total_shifts_in_pool:number;
  bonus_amount:number;
  hours_worked:number;
  percentage_share:number;
  created_at: string; // timestamptz
}

export interface BonusEmployeePayoutInsert {
  org_data_id: number;
  user_id: string;
  shift_type: string;
  shifts_worked: number;
  total_shifts_in_pool: number;
  bonus_amount: number;
}

export interface BonusEmployeePayoutUpdate {
  shifts_worked?: number;
  total_shifts_in_pool?: number;
  bonus_amount?: number;
}

// ---------------------------------------------
// BONUS LEADERBOARD CACHE
// ---------------------------------------------
export interface BonusLeaderboardCache {
  id: number;
  period_id: number;
  org_id: number;
  rank: number;
  percentage_change: number;
  created_at: string; // timestamptz
}

export interface BonusLeaderboardCacheInsert {
  period_id: number;
  org_id: number;
  rank: number;
  percentage_change: number;
}

export interface BonusLeaderboardCacheUpdate {
  rank?: number;
  percentage_change?: number;
}

// ---------------------------------------------
// JOINED / VIEW TYPES
// ---------------------------------------------

// Για Manager view - με organization details
export interface BonusOrganizationDataWithOrg extends BonusOrganizationData {
  organization: {
    id: number;
    store_name: string;
  };
  period: {
    quarter: number;
    year: number;
    status: 'draft' | 'published';
  };
}

// Για Barista view - με user details
export interface BonusEmployeePayoutWithDetails extends BonusEmployeePayout {
  user: {
    id: string;
    username: string;
    image_url: string | null;
  };
  organization_data: {
    org_id: number;
    period_id: number;
  };
}

// Για Leaderboard view - με organization name
export interface LeaderboardEntry extends BonusLeaderboardCache {
  organization: {
    id: number;
    store_name: string;
  };
  medal?: '🥇' | '🥈' | '🥉' | null;
}

// ---------------------------------------------
// CALCULATION HELPERS
// ---------------------------------------------

// Input για υπολογισμό bonus από Excel
export interface ExcelBonusInput {
  org_id: number;
  current_kilos: number;
  previous_kilos: number;
}

// Αποτέλεσμα υπολογισμού bonus
export interface CalculatedBonus {
  org_id: number;
  kilo_difference: number;
  percentage_change: number;
  above_network_average: boolean;
  base_bonus: number;
  multiplier: 1 | 1.25;
  final_bonus: number;
  morning_pool: number;
  afternoon_pool: number;
}

// Για κατανομή σε baristas
export interface BaristaShiftData {
  user_id: string;
  shift_type: string;
  shifts_worked: number;
}

export interface CalculatedPayout {
  user_id: string;
  shift_type: string;
  shifts_worked: number;
  total_shifts_in_pool: number;
  percentage_share: number;
  bonus_amount: number;
}

// ---------------------------------------------
// CONSTANTS
// ---------------------------------------------
export const BONUS_CONSTANTS = {
  BONUS_PER_KILO: 20, // €20 per kilo
  MULTIPLIER_ABOVE_AVERAGE: 1.25,
  MULTIPLIER_DEFAULT: 1,
  MORNING_POOL_PERCENTAGE: 0.6, // 60%
  AFTERNOON_POOL_PERCENTAGE: 0.4, // 40%
} as const;

// ---------------------------------------------
// UTILITY TYPES
// ---------------------------------------------
export type Quarter = 1 | 2 | 3 | 4;
export type BonusStatus = 'draft' | 'published';
export type Multiplier = 1 | 1.25;
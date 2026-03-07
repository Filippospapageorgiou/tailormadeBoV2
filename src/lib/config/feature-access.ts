// src/lib/config/feature-access.ts

export const FEATURE_ACCESS = {
  register: [1], 
} as const;

export type FeatureKey = keyof typeof FEATURE_ACCESS;

export function orgHasFeature(orgId: number | null, feature: FeatureKey): boolean {
  if (!orgId) return false;
  return (FEATURE_ACCESS[feature] as readonly number[]).includes(orgId);
}
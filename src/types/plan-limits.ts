/**
 * Plan limits that apply to a tenant.
 * These are checked during resource creation to enforce plan restrictions.
 */
export interface PlanLimits {
  maxUsers: number;
  maxWarehouses: number;
  maxProducts: number;
}

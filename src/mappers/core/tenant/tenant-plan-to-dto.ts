import type { TenantPlan } from '@/entities/core/tenant-plan';

export interface TenantPlanDTO {
  id: string;
  tenantId: string;
  planId: string;
  startsAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function tenantPlanToDTO(tenantPlan: TenantPlan): TenantPlanDTO {
  return {
    id: tenantPlan.tenantPlanId.toString(),
    tenantId: tenantPlan.tenantId.toString(),
    planId: tenantPlan.planId.toString(),
    startsAt: tenantPlan.startsAt,
    expiresAt: tenantPlan.expiresAt,
    createdAt: tenantPlan.createdAt,
    updatedAt: tenantPlan.updatedAt,
  };
}

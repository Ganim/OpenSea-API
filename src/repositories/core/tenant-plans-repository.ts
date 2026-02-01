import type { TenantPlan } from '@/entities/core/tenant-plan';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CreateTenantPlanSchema {
  tenantId: UniqueEntityID;
  planId: UniqueEntityID;
  startsAt?: Date;
  expiresAt?: Date | null;
}

export interface TenantPlansRepository {
  create(data: CreateTenantPlanSchema): Promise<TenantPlan>;
  findByTenantId(tenantId: UniqueEntityID): Promise<TenantPlan | null>;
  updatePlan(
    tenantId: UniqueEntityID,
    planId: UniqueEntityID,
  ): Promise<TenantPlan | null>;
}

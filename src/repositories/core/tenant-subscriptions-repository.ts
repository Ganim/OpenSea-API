import type { TenantSubscription } from '@/entities/core/tenant-subscription';

export interface TenantSubscriptionsRepository {
  findByTenantId(tenantId: string): Promise<TenantSubscription[]>;
  findByTenantAndSkill(
    tenantId: string,
    skillCode: string,
  ): Promise<TenantSubscription | null>;
  findActiveByTenantId(tenantId: string): Promise<TenantSubscription[]>;
  create(entity: TenantSubscription): Promise<void>;
  save(entity: TenantSubscription): Promise<void>;
  delete(id: string): Promise<void>;
}

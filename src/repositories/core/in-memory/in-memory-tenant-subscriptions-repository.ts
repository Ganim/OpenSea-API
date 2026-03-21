import type { TenantSubscription } from '@/entities/core/tenant-subscription';
import type { TenantSubscriptionsRepository } from '../tenant-subscriptions-repository';

export class InMemoryTenantSubscriptionsRepository
  implements TenantSubscriptionsRepository
{
  public items: TenantSubscription[] = [];

  async findByTenantId(tenantId: string): Promise<TenantSubscription[]> {
    return this.items.filter((item) => item.tenantId === tenantId);
  }

  async findByTenantAndSkill(
    tenantId: string,
    skillCode: string,
  ): Promise<TenantSubscription | null> {
    const subscription = this.items.find(
      (item) => item.tenantId === tenantId && item.skillCode === skillCode,
    );

    return subscription ?? null;
  }

  async findActiveByTenantId(tenantId: string): Promise<TenantSubscription[]> {
    return this.items.filter(
      (item) => item.tenantId === tenantId && item.status === 'ACTIVE',
    );
  }

  async create(entity: TenantSubscription): Promise<void> {
    this.items.push(entity);
  }

  async save(entity: TenantSubscription): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(entity.id));

    if (index !== -1) {
      this.items[index] = entity;
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === id);

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}

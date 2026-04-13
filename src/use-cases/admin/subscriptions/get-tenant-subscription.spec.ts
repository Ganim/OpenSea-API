import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantSubscriptionUseCase } from './get-tenant-subscription';

let subscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let sut: GetTenantSubscriptionUseCase;

const TENANT_ID = 'tenant-1';

describe('GetTenantSubscriptionUseCase', () => {
  beforeEach(() => {
    subscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    sut = new GetTenantSubscriptionUseCase(subscriptionsRepository);
  });

  it('should return all subscriptions for a tenant', async () => {
    const sub1 = TenantSubscription.create({
      tenantId: TENANT_ID,
      skillCode: 'stock.products',
    });
    const sub2 = TenantSubscription.create({
      tenantId: TENANT_ID,
      skillCode: 'finance.entries',
    });
    subscriptionsRepository.items.push(sub1, sub2);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.subscriptions).toHaveLength(2);
  });

  it('should return empty array when tenant has no subscriptions', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.subscriptions).toHaveLength(0);
  });

  it('should not return subscriptions from other tenants', async () => {
    const sub = TenantSubscription.create({
      tenantId: 'other-tenant',
      skillCode: 'stock.products',
    });
    subscriptionsRepository.items.push(sub);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.subscriptions).toHaveLength(0);
  });

  it('should return both active and cancelled subscriptions', async () => {
    const active = TenantSubscription.create({
      tenantId: TENANT_ID,
      skillCode: 'stock.products',
    });
    const cancelled = TenantSubscription.create({
      tenantId: TENANT_ID,
      skillCode: 'finance.entries',
    });
    cancelled.status = 'CANCELLED';
    subscriptionsRepository.items.push(active, cancelled);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.subscriptions).toHaveLength(2);
  });
});

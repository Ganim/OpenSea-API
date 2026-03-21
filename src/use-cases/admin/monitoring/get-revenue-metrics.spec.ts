import { TenantConsumption } from '@/entities/core/tenant-consumption';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { InMemoryTenantConsumptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-consumptions-repository';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetRevenueMetricsUseCase } from './get-revenue-metrics';

let subscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let consumptionsRepository: InMemoryTenantConsumptionsRepository;
let tenantsRepository: InMemoryTenantsRepository;
let sut: GetRevenueMetricsUseCase;

const CURRENT_PERIOD = new Date().toISOString().slice(0, 7);

describe('GetRevenueMetricsUseCase', () => {
  beforeEach(() => {
    subscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    consumptionsRepository = new InMemoryTenantConsumptionsRepository();
    tenantsRepository = new InMemoryTenantsRepository();
    sut = new GetRevenueMetricsUseCase(
      subscriptionsRepository,
      consumptionsRepository,
      tenantsRepository,
    );
  });

  it('should return zero MRR when no subscriptions exist', async () => {
    const result = await sut.execute();

    expect(result.mrr).toBe(0);
    expect(result.activeSubscriptionCount).toBe(0);
    expect(result.overageTotal).toBe(0);
    expect(result.churnRate).toBe(0);
  });

  it('should calculate MRR from active subscriptions', async () => {
    await subscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock',
        status: 'ACTIVE',
        customPrice: 100,
        quantity: 1,
      }),
    );
    await subscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-2',
        skillCode: 'stock',
        status: 'ACTIVE',
        customPrice: 200,
        quantity: 2,
      }),
    );

    const result = await sut.execute();

    expect(result.mrr).toBe(500);
    expect(result.activeSubscriptionCount).toBe(2);
  });

  it('should apply discount percentage to MRR calculation', async () => {
    await subscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock',
        status: 'ACTIVE',
        customPrice: 100,
        quantity: 1,
        discountPercent: 20,
      }),
    );

    const result = await sut.execute();

    expect(result.mrr).toBe(80);
  });

  it('should exclude cancelled subscriptions from MRR', async () => {
    await subscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock',
        status: 'ACTIVE',
        customPrice: 100,
      }),
    );
    await subscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-2',
        skillCode: 'stock',
        status: 'CANCELLED',
        customPrice: 200,
      }),
    );

    const result = await sut.execute();

    expect(result.mrr).toBe(100);
    expect(result.activeSubscriptionCount).toBe(1);
  });

  it('should sum overage costs from consumptions', async () => {
    await subscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock',
        status: 'ACTIVE',
        customPrice: 100,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'ai_queries_t1',
        used: 100,
        included: 50,
        overage: 50,
        overageCost: 10.5,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'storage_gb',
        used: 20,
        included: 10,
        overage: 10,
        overageCost: 5.25,
      }),
    );

    const result = await sut.execute();

    expect(result.overageTotal).toBe(15.75);
  });

  it('should return tenant count by status', async () => {
    await tenantsRepository.create({
      name: 'Active 1',
      slug: 'active-1',
      status: 'ACTIVE',
    });
    await tenantsRepository.create({
      name: 'Active 2',
      slug: 'active-2',
      status: 'ACTIVE',
    });
    await tenantsRepository.create({
      name: 'Suspended',
      slug: 'suspended',
      status: 'SUSPENDED',
    });

    const result = await sut.execute();

    expect(result.tenantCountByStatus).toEqual({
      ACTIVE: 2,
      SUSPENDED: 1,
    });
  });

  it('should return current period', async () => {
    const result = await sut.execute();

    expect(result.period).toBe(CURRENT_PERIOD);
  });
});

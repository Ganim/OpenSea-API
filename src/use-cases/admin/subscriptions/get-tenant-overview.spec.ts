import { TenantBilling } from '@/entities/core/tenant-billing';
import { TenantConsumption } from '@/entities/core/tenant-consumption';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { InMemoryTenantBillingsRepository } from '@/repositories/core/in-memory/in-memory-tenant-billings-repository';
import { InMemoryTenantConsumptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-consumptions-repository';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantOverviewUseCase } from './get-tenant-overview';

let subscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let consumptionsRepository: InMemoryTenantConsumptionsRepository;
let billingsRepository: InMemoryTenantBillingsRepository;
let sut: GetTenantOverviewUseCase;

const TENANT_ID = 'tenant-1';
const PERIOD = '2026-04';

describe('GetTenantOverviewUseCase', () => {
  beforeEach(() => {
    subscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    consumptionsRepository = new InMemoryTenantConsumptionsRepository();
    billingsRepository = new InMemoryTenantBillingsRepository();

    sut = new GetTenantOverviewUseCase(
      subscriptionsRepository,
      consumptionsRepository,
      billingsRepository,
    );
  });

  it('should return full overview with subscriptions, consumptions, and billing', async () => {
    const subscription = TenantSubscription.create({
      tenantId: TENANT_ID,
      skillCode: 'stock.products',
    });
    subscriptionsRepository.items.push(subscription);

    const consumption = TenantConsumption.create({
      tenantId: TENANT_ID,
      period: PERIOD,
      metric: 'api_calls',
      limit: 1000,
    });
    consumptionsRepository.items.push(consumption);

    const billing = TenantBilling.create({
      tenantId: TENANT_ID,
      period: PERIOD,
      subscriptionTotal: 100,
      consumptionTotal: 50,
      totalAmount: 150,
      dueDate: new Date('2026-05-10'),
    });
    billingsRepository.items.push(billing);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      period: PERIOD,
    });

    expect(result.subscriptions).toHaveLength(1);
    expect(result.consumptions).toHaveLength(1);
    expect(result.billing).toBeDefined();
    expect(result.billing?.totalAmount).toBe(150);
  });

  it('should return null billing when none exists for the period', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      period: PERIOD,
    });

    expect(result.subscriptions).toHaveLength(0);
    expect(result.consumptions).toHaveLength(0);
    expect(result.billing).toBeNull();
  });

  it('should default to current month when no period is provided', async () => {
    const currentPeriod = new Date().toISOString().slice(0, 7);

    const consumption = TenantConsumption.create({
      tenantId: TENANT_ID,
      period: currentPeriod,
      metric: 'storage_gb',
      limit: 50,
    });
    consumptionsRepository.items.push(consumption);

    const result = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(result.consumptions).toHaveLength(1);
    expect(result.consumptions[0].metric).toBe('storage_gb');
  });

  it('should only return active subscriptions', async () => {
    const active = TenantSubscription.create({
      tenantId: TENANT_ID,
      skillCode: 'stock.products',
    });
    subscriptionsRepository.items.push(active);

    const cancelled = TenantSubscription.create({
      tenantId: TENANT_ID,
      skillCode: 'finance.entries',
    });
    cancelled.status = 'CANCELLED';
    subscriptionsRepository.items.push(cancelled);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      period: PERIOD,
    });

    expect(result.subscriptions).toHaveLength(1);
    expect(result.subscriptions[0].skillCode).toBe('stock.products');
  });
});

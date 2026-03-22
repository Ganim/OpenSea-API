import { InMemoryTenantConsumptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-consumptions-repository';
import { TenantConsumption } from '@/entities/core/tenant-consumption';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantConsumptionUseCase } from './get-tenant-consumption';

let tenantConsumptionsRepository: InMemoryTenantConsumptionsRepository;
let sut: GetTenantConsumptionUseCase;

describe('GetTenantConsumptionUseCase', () => {
  beforeEach(() => {
    tenantConsumptionsRepository = new InMemoryTenantConsumptionsRepository();
    sut = new GetTenantConsumptionUseCase(tenantConsumptionsRepository);
  });

  it('should return consumption metrics for a specific period', async () => {
    await tenantConsumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: '2026-03',
        metric: 'storage_mb',
        used: 500,
        included: 1000,
      }),
    );

    await tenantConsumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: '2026-03',
        metric: 'api_calls',
        used: 15000,
        included: 50000,
      }),
    );

    const { consumptions, period } = await sut.execute({
      tenantId: 'tenant-1',
      period: '2026-03',
    });

    expect(period).toBe('2026-03');
    expect(consumptions).toHaveLength(2);
  });

  it('should default to current month when no period is provided', async () => {
    const now = new Date();
    const expectedPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await tenantConsumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: expectedPeriod,
        metric: 'storage_mb',
        used: 200,
        included: 1000,
      }),
    );

    const { consumptions, period } = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(period).toBe(expectedPeriod);
    expect(consumptions).toHaveLength(1);
  });

  it('should return empty array when no consumption exists for the period', async () => {
    const { consumptions } = await sut.execute({
      tenantId: 'tenant-1',
      period: '2026-01',
    });

    expect(consumptions).toHaveLength(0);
  });

  it('should not return consumption from other tenants', async () => {
    await tenantConsumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: '2026-03',
        metric: 'storage_mb',
        used: 500,
        included: 1000,
      }),
    );

    await tenantConsumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-2',
        period: '2026-03',
        metric: 'storage_mb',
        used: 800,
        included: 1000,
      }),
    );

    const { consumptions } = await sut.execute({
      tenantId: 'tenant-1',
      period: '2026-03',
    });

    expect(consumptions).toHaveLength(1);
    expect(consumptions[0].tenantId).toBe('tenant-1');
  });
});

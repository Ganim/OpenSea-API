import { InMemoryTenantConsumptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-consumptions-repository';
import { TenantConsumption } from '@/entities/core/tenant-consumption';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { beforeEach, describe, expect, it } from 'vitest';
import { OverrideTenantLimitUseCase } from './override-tenant-limit';

let tenantConsumptionsRepository: InMemoryTenantConsumptionsRepository;
let sut: OverrideTenantLimitUseCase;

describe('OverrideTenantLimitUseCase', () => {
  beforeEach(() => {
    tenantConsumptionsRepository = new InMemoryTenantConsumptionsRepository();
    sut = new OverrideTenantLimitUseCase(tenantConsumptionsRepository);
  });

  it('should create a new consumption record with the limit', async () => {
    const { consumption } = await sut.execute({
      tenantId: 'tenant-1',
      metric: 'storage_mb',
      newLimit: 5000,
    });

    expect(consumption.limit).toBe(5000);
    expect(consumption.metric).toBe('storage_mb');
    expect(tenantConsumptionsRepository.items).toHaveLength(1);
  });

  it('should update the limit on an existing consumption record', async () => {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await tenantConsumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: currentPeriod,
        metric: 'storage_mb',
        used: 500,
        included: 1000,
        limit: 2000,
      }),
    );

    const { consumption } = await sut.execute({
      tenantId: 'tenant-1',
      metric: 'storage_mb',
      newLimit: 10000,
    });

    expect(consumption.limit).toBe(10000);
    expect(consumption.used).toBe(500);
    expect(tenantConsumptionsRepository.items).toHaveLength(1);
  });

  it('should allow setting limit to zero', async () => {
    const { consumption } = await sut.execute({
      tenantId: 'tenant-1',
      metric: 'api_calls',
      newLimit: 0,
    });

    expect(consumption.limit).toBe(0);
  });

  it('should throw BadRequestError when limit is negative', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        metric: 'storage_mb',
        newLimit: -100,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});

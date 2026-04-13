import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { TenantConsumption } from '@/entities/core/tenant-consumption';
import { InMemoryTenantConsumptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-consumptions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { OverrideTenantLimitUseCase } from './override-tenant-limit';

let consumptionsRepository: InMemoryTenantConsumptionsRepository;
let sut: OverrideTenantLimitUseCase;

const TENANT_ID = 'tenant-1';
const METRIC = 'api_calls';
const PERIOD = '2026-04';

describe('OverrideTenantLimitUseCase', () => {
  beforeEach(() => {
    consumptionsRepository = new InMemoryTenantConsumptionsRepository();
    sut = new OverrideTenantLimitUseCase(consumptionsRepository);
  });

  it('should override the limit on an existing consumption record', async () => {
    const existing = TenantConsumption.create({
      tenantId: TENANT_ID,
      period: PERIOD,
      metric: METRIC,
      limit: 100,
    });
    consumptionsRepository.items.push(existing);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      metric: METRIC,
      newLimit: 500,
      period: PERIOD,
    });

    expect(result.consumption.limit).toBe(500);
    expect(consumptionsRepository.items).toHaveLength(1);
  });

  it('should create a new consumption record if none exists', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      metric: METRIC,
      newLimit: 250,
      period: PERIOD,
    });

    expect(result.consumption.limit).toBe(250);
    expect(result.consumption.tenantId).toBe(TENANT_ID);
    expect(result.consumption.metric).toBe(METRIC);
    expect(result.consumption.period).toBe(PERIOD);
    expect(consumptionsRepository.items).toHaveLength(1);
  });

  it('should default to current month when no period is provided', async () => {
    const currentPeriod = new Date().toISOString().slice(0, 7);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      metric: METRIC,
      newLimit: 300,
    });

    expect(result.consumption.period).toBe(currentPeriod);
  });

  it('should allow setting limit to zero', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      metric: METRIC,
      newLimit: 0,
      period: PERIOD,
    });

    expect(result.consumption.limit).toBe(0);
  });

  it('should throw BadRequestError if limit is negative', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        metric: METRIC,
        newLimit: -10,
        period: PERIOD,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});

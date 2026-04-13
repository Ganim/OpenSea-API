import { TenantConsumption } from '@/entities/core/tenant-consumption';
import { InMemoryTenantConsumptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-consumptions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantConsumptionUseCase } from './get-tenant-consumption';

let consumptionsRepository: InMemoryTenantConsumptionsRepository;
let sut: GetTenantConsumptionUseCase;

const TENANT_ID = 'tenant-1';

function createConsumption(
  metric: string,
  period: string = '2026-04',
  tenantId: string = TENANT_ID,
) {
  const consumption = TenantConsumption.create({
    tenantId,
    period,
    metric,
    limit: 100,
  });
  consumptionsRepository.items.push(consumption);
  return consumption;
}

describe('GetTenantConsumptionUseCase', () => {
  beforeEach(() => {
    consumptionsRepository = new InMemoryTenantConsumptionsRepository();
    sut = new GetTenantConsumptionUseCase(consumptionsRepository);
  });

  it('should return consumptions for a tenant and period', async () => {
    createConsumption('api_calls', '2026-04');
    createConsumption('storage_gb', '2026-04');
    createConsumption('api_calls', '2026-03'); // different period

    const result = await sut.execute({
      tenantId: TENANT_ID,
      period: '2026-04',
    });

    expect(result.consumptions).toHaveLength(2);
  });

  it('should default to current month when no period is provided', async () => {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    createConsumption('api_calls', currentPeriod);

    const result = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(result.consumptions).toHaveLength(1);
    expect(result.consumptions[0].metric).toBe('api_calls');
  });

  it('should return empty array when no consumptions exist', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      period: '2026-04',
    });

    expect(result.consumptions).toHaveLength(0);
  });

  it('should not return consumptions from other tenants', async () => {
    createConsumption('api_calls', '2026-04', 'other-tenant');

    const result = await sut.execute({
      tenantId: TENANT_ID,
      period: '2026-04',
    });

    expect(result.consumptions).toHaveLength(0);
  });
});

import { TenantConsumption } from '@/entities/core/tenant-consumption';
import { InMemoryTenantConsumptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-consumptions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetAiUsageReportUseCase } from './get-ai-usage-report';

let consumptionsRepository: InMemoryTenantConsumptionsRepository;
let sut: GetAiUsageReportUseCase;

const CURRENT_PERIOD = '2026-03';

describe('GetAiUsageReportUseCase', () => {
  beforeEach(() => {
    consumptionsRepository = new InMemoryTenantConsumptionsRepository();
    sut = new GetAiUsageReportUseCase(consumptionsRepository);
  });

  it('should return empty report when no AI consumptions exist', async () => {
    const result = await sut.execute({ period: CURRENT_PERIOD });

    expect(result.totalAiQueries).toBe(0);
    expect(result.totalAiCost).toBe(0);
    expect(result.tierBreakdown).toHaveLength(0);
    expect(result.topTenantsByAiCost).toHaveLength(0);
    expect(result.period).toBe(CURRENT_PERIOD);
  });

  it('should aggregate AI queries by tier', async () => {
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'ai_queries_t1',
        used: 100,
        included: 50,
        overage: 50,
        overageCost: 5.0,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-2',
        period: CURRENT_PERIOD,
        metric: 'ai_queries_t1',
        used: 200,
        included: 50,
        overage: 150,
        overageCost: 15.0,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'ai_queries_t2',
        used: 30,
        included: 20,
        overage: 10,
        overageCost: 3.0,
      }),
    );

    const result = await sut.execute({ period: CURRENT_PERIOD });

    expect(result.totalAiQueries).toBe(330);
    expect(result.totalAiCost).toBe(23.0);
    expect(result.tierBreakdown).toHaveLength(2);

    const t1Tier = result.tierBreakdown.find((t) => t.tier === 'ai_queries_t1');
    expect(t1Tier?.totalUsed).toBe(300);
    expect(t1Tier?.totalOverageCost).toBe(20.0);
  });

  it('should rank top tenants by AI cost', async () => {
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-low',
        period: CURRENT_PERIOD,
        metric: 'ai_queries_t1',
        used: 10,
        overageCost: 1.0,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-high',
        period: CURRENT_PERIOD,
        metric: 'ai_queries_t1',
        used: 500,
        overageCost: 50.0,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-mid',
        period: CURRENT_PERIOD,
        metric: 'ai_queries_t1',
        used: 100,
        overageCost: 10.0,
      }),
    );

    const result = await sut.execute({ period: CURRENT_PERIOD });

    expect(result.topTenantsByAiCost[0].tenantId).toBe('tenant-high');
    expect(result.topTenantsByAiCost[1].tenantId).toBe('tenant-mid');
    expect(result.topTenantsByAiCost[2].tenantId).toBe('tenant-low');
  });

  it('should ignore non-AI metrics', async () => {
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'storage_gb',
        used: 100,
        overageCost: 20.0,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'ai_queries_t1',
        used: 50,
        overageCost: 5.0,
      }),
    );

    const result = await sut.execute({ period: CURRENT_PERIOD });

    expect(result.totalAiQueries).toBe(50);
    expect(result.totalAiCost).toBe(5.0);
    expect(result.tierBreakdown).toHaveLength(1);
  });

  it('should default to current month period', async () => {
    const result = await sut.execute({});
    const expectedPeriod = new Date().toISOString().slice(0, 7);

    expect(result.period).toBe(expectedPeriod);
  });
});

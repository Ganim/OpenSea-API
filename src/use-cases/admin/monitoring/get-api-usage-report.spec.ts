import { TenantConsumption } from '@/entities/core/tenant-consumption';
import { InMemoryTenantConsumptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-consumptions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetApiUsageReportUseCase } from './get-api-usage-report';

let consumptionsRepository: InMemoryTenantConsumptionsRepository;
let sut: GetApiUsageReportUseCase;

const CURRENT_PERIOD = '2026-03';

describe('GetApiUsageReportUseCase', () => {
  beforeEach(() => {
    consumptionsRepository = new InMemoryTenantConsumptionsRepository();
    sut = new GetApiUsageReportUseCase(consumptionsRepository);
  });

  it('should return empty report when no consumptions exist', async () => {
    const apiUsageReport = await sut.execute({ period: CURRENT_PERIOD });

    expect(apiUsageReport.totalCost).toBe(0);
    expect(apiUsageReport.categories).toHaveLength(0);
    expect(apiUsageReport.topTenantsByCost).toHaveLength(0);
    expect(apiUsageReport.period).toBe(CURRENT_PERIOD);
  });

  it('should group consumptions by category', async () => {
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
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'whatsapp_messages',
        used: 200,
        included: 100,
        overage: 100,
        overageCost: 10.0,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'pix_transactions',
        used: 50,
        included: 20,
        overage: 30,
        overageCost: 3.0,
      }),
    );

    const apiUsageReport = await sut.execute({ period: CURRENT_PERIOD });

    expect(apiUsageReport.totalCost).toBe(18.0);
    expect(apiUsageReport.categories).toHaveLength(3);

    const aiCategory = apiUsageReport.categories.find(
      (c) => c.category === 'ai',
    );
    expect(aiCategory?.totalUsed).toBe(100);
    expect(aiCategory?.totalCost).toBe(5.0);

    const messagingCategory = apiUsageReport.categories.find(
      (c) => c.category === 'messaging',
    );
    expect(messagingCategory?.totalUsed).toBe(200);
    expect(messagingCategory?.totalCost).toBe(10.0);

    const paymentsCategory = apiUsageReport.categories.find(
      (c) => c.category === 'payments',
    );
    expect(paymentsCategory?.totalUsed).toBe(50);
    expect(paymentsCategory?.totalCost).toBe(3.0);
  });

  it('should aggregate multiple metrics within same category', async () => {
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
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'ai_queries_t2',
        used: 30,
        included: 10,
        overage: 20,
        overageCost: 6.0,
      }),
    );

    const apiUsageReport = await sut.execute({ period: CURRENT_PERIOD });

    const aiCategory = apiUsageReport.categories.find(
      (c) => c.category === 'ai',
    );
    expect(aiCategory?.totalUsed).toBe(130);
    expect(aiCategory?.totalCost).toBe(11.0);
    expect(aiCategory?.metrics).toHaveLength(2);
  });

  it('should rank top tenants by total cost across all categories', async () => {
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
        tenantId: 'tenant-high',
        period: CURRENT_PERIOD,
        metric: 'pix_transactions',
        used: 200,
        overageCost: 20.0,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-mid',
        period: CURRENT_PERIOD,
        metric: 'whatsapp_messages',
        used: 100,
        overageCost: 10.0,
      }),
    );

    const apiUsageReport = await sut.execute({ period: CURRENT_PERIOD });

    expect(apiUsageReport.topTenantsByCost[0].tenantId).toBe('tenant-high');
    expect(apiUsageReport.topTenantsByCost[0].totalCost).toBe(70.0);
    expect(apiUsageReport.topTenantsByCost[0].breakdown).toHaveProperty('ai');
    expect(apiUsageReport.topTenantsByCost[0].breakdown).toHaveProperty(
      'payments',
    );
    expect(apiUsageReport.topTenantsByCost[1].tenantId).toBe('tenant-mid');
    expect(apiUsageReport.topTenantsByCost[2].tenantId).toBe('tenant-low');
  });

  it('should include per-tenant breakdown by category', async () => {
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'ai_queries_t1',
        used: 100,
        overageCost: 10.0,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'fiscal_documents',
        used: 50,
        overageCost: 5.0,
      }),
    );

    const apiUsageReport = await sut.execute({ period: CURRENT_PERIOD });

    const tenantBreakdown = apiUsageReport.topTenantsByCost[0];
    expect(tenantBreakdown.breakdown.ai).toBe(10.0);
    expect(tenantBreakdown.breakdown.fiscal).toBe(5.0);
  });

  it('should default to current month period', async () => {
    const apiUsageReport = await sut.execute({});
    const expectedPeriod = new Date().toISOString().slice(0, 7);

    expect(apiUsageReport.period).toBe(expectedPeriod);
  });

  it('should limit top tenants to 10', async () => {
    for (let i = 0; i < 15; i++) {
      await consumptionsRepository.upsert(
        TenantConsumption.create({
          tenantId: `tenant-${i}`,
          period: CURRENT_PERIOD,
          metric: 'ai_queries_t1',
          used: 10 * (i + 1),
          overageCost: i + 1,
        }),
      );
    }

    const apiUsageReport = await sut.execute({ period: CURRENT_PERIOD });

    expect(apiUsageReport.topTenantsByCost).toHaveLength(10);
    expect(apiUsageReport.topTenantsByCost[0].tenantId).toBe('tenant-14');
  });

  it('should resolve messaging category for multiple providers', async () => {
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'whatsapp_messages',
        used: 100,
        overageCost: 5.0,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'instagram_messages',
        used: 50,
        overageCost: 2.5,
      }),
    );
    await consumptionsRepository.upsert(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: CURRENT_PERIOD,
        metric: 'telegram_messages',
        used: 30,
        overageCost: 1.0,
      }),
    );

    const apiUsageReport = await sut.execute({ period: CURRENT_PERIOD });

    const messagingCategory = apiUsageReport.categories.find(
      (c) => c.category === 'messaging',
    );
    expect(messagingCategory?.totalUsed).toBe(180);
    expect(messagingCategory?.totalCost).toBe(8.5);
    expect(messagingCategory?.metrics).toHaveLength(3);
  });
});

import type { TenantConsumptionsRepository } from '@/repositories/core/tenant-consumptions-repository';

interface AiTierUsage {
  tier: string;
  totalUsed: number;
  totalIncluded: number;
  totalOverage: number;
  totalOverageCost: number;
}

interface TopTenantByAiCost {
  tenantId: string;
  totalCost: number;
  totalQueries: number;
}

interface GetAiUsageReportUseCaseRequest {
  period?: string;
}

interface GetAiUsageReportUseCaseResponse {
  period: string;
  totalAiQueries: number;
  totalAiCost: number;
  tierBreakdown: AiTierUsage[];
  topTenantsByAiCost: TopTenantByAiCost[];
}

export class GetAiUsageReportUseCase {
  constructor(
    private tenantConsumptionsRepository: TenantConsumptionsRepository,
  ) {}

  async execute({
    period,
  }: GetAiUsageReportUseCaseRequest): Promise<GetAiUsageReportUseCaseResponse> {
    const currentPeriod = period ?? new Date().toISOString().slice(0, 7);

    const aiConsumptions =
      await this.tenantConsumptionsRepository.findByPeriodAndMetricPrefix(
        currentPeriod,
        'ai_',
      );

    // Aggregate by tier
    const tierMap = new Map<
      string,
      { used: number; included: number; overage: number; overageCost: number }
    >();

    // Aggregate by tenant
    const tenantMap = new Map<string, { cost: number; queries: number }>();

    let totalAiQueries = 0;
    let totalAiCost = 0;

    for (const consumption of aiConsumptions) {
      const tier = consumption.metric;
      totalAiQueries += consumption.used;
      totalAiCost += consumption.overageCost;

      // Tier aggregation
      const tierAgg = tierMap.get(tier) ?? {
        used: 0,
        included: 0,
        overage: 0,
        overageCost: 0,
      };
      tierAgg.used += consumption.used;
      tierAgg.included += consumption.included;
      tierAgg.overage += consumption.overage;
      tierAgg.overageCost += consumption.overageCost;
      tierMap.set(tier, tierAgg);

      // Tenant aggregation
      const tenantAgg = tenantMap.get(consumption.tenantId) ?? {
        cost: 0,
        queries: 0,
      };
      tenantAgg.cost += consumption.overageCost;
      tenantAgg.queries += consumption.used;
      tenantMap.set(consumption.tenantId, tenantAgg);
    }

    const tierBreakdown: AiTierUsage[] = Array.from(tierMap.entries()).map(
      ([tier, agg]) => ({
        tier,
        totalUsed: agg.used,
        totalIncluded: agg.included,
        totalOverage: agg.overage,
        totalOverageCost: agg.overageCost,
      }),
    );

    const topTenantsByAiCost: TopTenantByAiCost[] = Array.from(
      tenantMap.entries(),
    )
      .map(([tenantId, agg]) => ({
        tenantId,
        totalCost: agg.cost,
        totalQueries: agg.queries,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    return {
      period: currentPeriod,
      totalAiQueries,
      totalAiCost,
      tierBreakdown,
      topTenantsByAiCost,
    };
  }
}

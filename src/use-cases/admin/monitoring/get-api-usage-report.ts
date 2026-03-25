import {
  METRIC_CATEGORIES,
  type MetricCategory,
} from '@/constants/api-metrics';
import type { TenantConsumptionsRepository } from '@/repositories/core/tenant-consumptions-repository';

interface MetricUsage {
  metric: string;
  used: number;
  included: number;
  overage: number;
  cost: number;
}

interface CategoryUsage {
  category: MetricCategory;
  label: string;
  color: string;
  totalUsed: number;
  totalIncluded: number;
  totalOverage: number;
  totalCost: number;
  metrics: MetricUsage[];
}

interface TopTenantByCost {
  tenantId: string;
  totalCost: number;
  breakdown: Record<string, number>;
}

interface GetApiUsageReportUseCaseRequest {
  period?: string;
}

interface GetApiUsageReportUseCaseResponse {
  period: string;
  totalCost: number;
  categories: CategoryUsage[];
  topTenantsByCost: TopTenantByCost[];
}

export class GetApiUsageReportUseCase {
  constructor(
    private tenantConsumptionsRepository: TenantConsumptionsRepository,
  ) {}

  async execute({
    period,
  }: GetApiUsageReportUseCaseRequest): Promise<GetApiUsageReportUseCaseResponse> {
    const currentPeriod = period ?? new Date().toISOString().slice(0, 7);

    const allConsumptions =
      await this.tenantConsumptionsRepository.findByPeriod(currentPeriod);

    // Build category aggregation maps
    const categoryMetricMap = new Map<
      MetricCategory,
      Map<
        string,
        { used: number; included: number; overage: number; cost: number }
      >
    >();

    // Build tenant aggregation: tenantId -> category -> cost
    const tenantCategoryMap = new Map<
      string,
      { totalCost: number; breakdown: Map<string, number> }
    >();

    let totalCost = 0;

    for (const consumption of allConsumptions) {
      const category = this.resolveCategory(consumption.metric);
      if (!category) continue;

      // Category-metric aggregation
      if (!categoryMetricMap.has(category)) {
        categoryMetricMap.set(category, new Map());
      }
      const metricMap = categoryMetricMap.get(category)!;
      const metricAgg = metricMap.get(consumption.metric) ?? {
        used: 0,
        included: 0,
        overage: 0,
        cost: 0,
      };
      metricAgg.used += consumption.used;
      metricAgg.included += consumption.included;
      metricAgg.overage += consumption.overage;
      metricAgg.cost += consumption.overageCost;
      metricMap.set(consumption.metric, metricAgg);

      totalCost += consumption.overageCost;

      // Tenant aggregation
      const tenantAgg = tenantCategoryMap.get(consumption.tenantId) ?? {
        totalCost: 0,
        breakdown: new Map<string, number>(),
      };
      tenantAgg.totalCost += consumption.overageCost;
      const currentCategoryCost = tenantAgg.breakdown.get(category) ?? 0;
      tenantAgg.breakdown.set(
        category,
        currentCategoryCost + consumption.overageCost,
      );
      tenantCategoryMap.set(consumption.tenantId, tenantAgg);
    }

    // Build categories response
    const categories: CategoryUsage[] = [];
    for (const [categoryKey, categoryDef] of Object.entries(
      METRIC_CATEGORIES,
    )) {
      const metricMap = categoryMetricMap.get(categoryKey as MetricCategory);
      if (!metricMap) continue;

      let totalUsed = 0;
      let totalIncluded = 0;
      let totalOverage = 0;
      let categoryTotalCost = 0;
      const metrics: MetricUsage[] = [];

      for (const [metricName, agg] of metricMap.entries()) {
        totalUsed += agg.used;
        totalIncluded += agg.included;
        totalOverage += agg.overage;
        categoryTotalCost += agg.cost;
        metrics.push({
          metric: metricName,
          used: agg.used,
          included: agg.included,
          overage: agg.overage,
          cost: agg.cost,
        });
      }

      categories.push({
        category: categoryKey as MetricCategory,
        label: categoryDef.label,
        color: categoryDef.color,
        totalUsed,
        totalIncluded,
        totalOverage,
        totalCost: categoryTotalCost,
        metrics,
      });
    }

    // Build top tenants by cost (top 10)
    const topTenantsByCost: TopTenantByCost[] = Array.from(
      tenantCategoryMap.entries(),
    )
      .map(([tenantId, agg]) => ({
        tenantId,
        totalCost: agg.totalCost,
        breakdown: Object.fromEntries(agg.breakdown),
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    return {
      period: currentPeriod,
      totalCost,
      categories,
      topTenantsByCost,
    };
  }

  private resolveCategory(metric: string): MetricCategory | null {
    for (const [categoryKey, categoryDef] of Object.entries(
      METRIC_CATEGORIES,
    )) {
      const prefixes = categoryDef.prefix.split('|');
      for (const prefix of prefixes) {
        if (metric.startsWith(prefix)) {
          return categoryKey as MetricCategory;
        }
      }
    }
    return null;
  }
}

import type { AnalyticsDashboardDTO } from '@/mappers/sales/analytics/dashboard-to-dto';
import { dashboardToDTO } from '@/mappers/sales/analytics/dashboard-to-dto';
import { AnalyticsDashboardsRepository } from '@/repositories/sales/analytics-dashboards-repository';

interface ListDashboardsUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  role?: string;
  visibility?: string;
}

interface ListDashboardsUseCaseResponse {
  dashboards: AnalyticsDashboardDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListDashboardsUseCase {
  constructor(private dashboardsRepository: AnalyticsDashboardsRepository) {}

  async execute(
    input: ListDashboardsUseCaseRequest,
  ): Promise<ListDashboardsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const filters = { role: input.role, visibility: input.visibility };

    const [dashboards, total] = await Promise.all([
      this.dashboardsRepository.findMany(
        page,
        perPage,
        input.tenantId,
        filters,
      ),
      this.dashboardsRepository.countMany(input.tenantId, filters),
    ]);

    return {
      dashboards: dashboards.map(dashboardToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}

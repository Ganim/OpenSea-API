import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { AnalyticsDashboardDTO } from '@/mappers/sales/analytics/dashboard-to-dto';
import { dashboardToDTO } from '@/mappers/sales/analytics/dashboard-to-dto';
import { AnalyticsDashboardsRepository } from '@/repositories/sales/analytics-dashboards-repository';

interface CreateDashboardUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  role?: string;
  visibility?: string;
  layout?: Record<string, unknown>;
  createdByUserId: string;
}

interface CreateDashboardUseCaseResponse {
  dashboard: AnalyticsDashboardDTO;
}

const VALID_ROLES = ['SELLER', 'MANAGER', 'DIRECTOR', 'BID_SPECIALIST', 'MARKETPLACE_OPS', 'CASHIER'];
const VALID_VISIBILITIES = ['PRIVATE', 'TEAM', 'TENANT'];

export class CreateDashboardUseCase {
  constructor(private dashboardsRepository: AnalyticsDashboardsRepository) {}

  async execute(input: CreateDashboardUseCaseRequest): Promise<CreateDashboardUseCaseResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Dashboard name is required.');
    }

    if (input.name.length > 128) {
      throw new BadRequestError('Dashboard name cannot exceed 128 characters.');
    }

    if (input.role && !VALID_ROLES.includes(input.role)) {
      throw new BadRequestError(`Invalid dashboard role: ${input.role}`);
    }

    if (input.visibility && !VALID_VISIBILITIES.includes(input.visibility)) {
      throw new BadRequestError(`Invalid visibility: ${input.visibility}`);
    }

    const dashboard = await this.dashboardsRepository.create({
      tenantId: input.tenantId,
      name: input.name.trim(),
      description: input.description,
      role: input.role,
      visibility: input.visibility,
      layout: input.layout,
      createdByUserId: input.createdByUserId,
    });

    return { dashboard: dashboardToDTO(dashboard) };
  }
}

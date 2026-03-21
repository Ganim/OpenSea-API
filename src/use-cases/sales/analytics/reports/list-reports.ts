import type { AnalyticsReportDTO } from '@/mappers/sales/analytics/report-to-dto';
import { reportToDTO } from '@/mappers/sales/analytics/report-to-dto';
import { AnalyticsReportsRepository } from '@/repositories/sales/analytics-reports-repository';

interface ListReportsUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  type?: string;
  isScheduled?: boolean;
  isActive?: boolean;
}

interface ListReportsUseCaseResponse {
  reports: AnalyticsReportDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListReportsUseCase {
  constructor(private reportsRepository: AnalyticsReportsRepository) {}

  async execute(input: ListReportsUseCaseRequest): Promise<ListReportsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const filters = {
      type: input.type,
      isScheduled: input.isScheduled,
      isActive: input.isActive,
    };

    const [reports, total] = await Promise.all([
      this.reportsRepository.findMany(page, perPage, input.tenantId, filters),
      this.reportsRepository.countMany(input.tenantId, filters),
    ]);

    return {
      reports: reports.map(reportToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}

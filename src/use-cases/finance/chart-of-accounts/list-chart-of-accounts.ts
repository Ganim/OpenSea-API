import {
  type ChartOfAccountDTO,
  chartOfAccountToDTO,
} from '@/mappers/finance/chart-of-account/chart-of-account-to-dto';
import type { ChartOfAccountsRepository } from '@/repositories/finance/chart-of-accounts-repository';

interface ListChartOfAccountsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ListChartOfAccountsUseCaseResponse {
  chartOfAccounts: ChartOfAccountDTO[];
  meta: PaginationMeta;
}

export class ListChartOfAccountsUseCase {
  constructor(private chartOfAccountsRepository: ChartOfAccountsRepository) {}

  async execute({
    tenantId,
    page = 1,
    limit = 20,
  }: ListChartOfAccountsUseCaseRequest): Promise<ListChartOfAccountsUseCaseResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const { chartOfAccounts, total } =
      await this.chartOfAccountsRepository.findManyPaginated(
        tenantId,
        safePage,
        safeLimit,
      );

    return {
      chartOfAccounts: chartOfAccounts.map(chartOfAccountToDTO),
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }
}

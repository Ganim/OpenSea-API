import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface ListFinanceEntriesUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  categoryId?: string;
  costCenterId?: string;
  bankAccountId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  isOverdue?: boolean;
  customerName?: string;
  supplierName?: string;
  overdueRange?: string;
  search?: string;
}

interface ListFinanceEntriesUseCaseResponse {
  entries: FinanceEntryDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListFinanceEntriesUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: ListFinanceEntriesUseCaseRequest,
  ): Promise<ListFinanceEntriesUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const { entries, total } = await this.financeEntriesRepository.findMany({
      tenantId: request.tenantId,
      page,
      limit,
      type: request.type,
      status: request.status,
      categoryId: request.categoryId,
      costCenterId: request.costCenterId,
      bankAccountId: request.bankAccountId,
      dueDateFrom: request.dueDateFrom,
      dueDateTo: request.dueDateTo,
      isOverdue: request.isOverdue,
      customerName: request.customerName,
      supplierName: request.supplierName,
      overdueRange: request.overdueRange,
      search: request.search,
    });

    return {
      entries: entries.map(financeEntryToDTO),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

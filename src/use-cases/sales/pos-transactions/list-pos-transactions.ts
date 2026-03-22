import type { PosTransaction } from '@/entities/sales/pos-transaction';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { PosTransactionsRepository } from '@/repositories/sales/pos-transactions-repository';

interface ListPosTransactionsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  sessionId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListPosTransactionsUseCaseResponse {
  transactions: PosTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListPosTransactionsUseCase {
  constructor(private posTransactionsRepository: PosTransactionsRepository) {}

  async execute(
    request: ListPosTransactionsUseCaseRequest,
  ): Promise<ListPosTransactionsUseCaseResponse> {
    const result: PaginatedResult<PosTransaction> =
      await this.posTransactionsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        sessionId: request.sessionId,
        status: request.status,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      });

    return {
      transactions: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}

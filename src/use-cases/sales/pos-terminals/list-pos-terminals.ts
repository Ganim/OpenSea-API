import type { PosTerminal } from '@/entities/sales/pos-terminal';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface ListPosTerminalsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  mode?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListPosTerminalsUseCaseResponse {
  terminals: PosTerminal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListPosTerminalsUseCase {
  constructor(private posTerminalsRepository: PosTerminalsRepository) {}

  async execute(
    request: ListPosTerminalsUseCaseRequest,
  ): Promise<ListPosTerminalsUseCaseResponse> {
    const result: PaginatedResult<PosTerminal> =
      await this.posTerminalsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        search: request.search,
        mode: request.mode,
        isActive: request.isActive,
        includeDeleted: request.includeDeleted,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      });

    return {
      terminals: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}

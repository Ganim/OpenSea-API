import type { PosSession } from '@/entities/sales/pos-session';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { PosSessionsRepository } from '@/repositories/sales/pos-sessions-repository';

interface ListPosSessionsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  terminalId?: string;
  status?: string;
  operatorUserId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListPosSessionsUseCaseResponse {
  sessions: PosSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListPosSessionsUseCase {
  constructor(private posSessionsRepository: PosSessionsRepository) {}

  async execute(
    request: ListPosSessionsUseCaseRequest,
  ): Promise<ListPosSessionsUseCaseResponse> {
    const result: PaginatedResult<PosSession> =
      await this.posSessionsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        terminalId: request.terminalId,
        status: request.status,
        operatorUserId: request.operatorUserId,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      });

    return {
      sessions: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}

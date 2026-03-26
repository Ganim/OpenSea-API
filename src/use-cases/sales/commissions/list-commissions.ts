import type {
  CommissionRecord,
  CommissionsRepository,
} from '@/repositories/sales/commissions-repository';
import type { PaginatedResult } from '@/repositories/pagination-params';

interface ListCommissionsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  status?: string;
  userId?: string;
}

interface ListCommissionsUseCaseResponse {
  commissions: PaginatedResult<CommissionRecord>;
}

export class ListCommissionsUseCase {
  constructor(private commissionsRepository: CommissionsRepository) {}

  async execute(
    request: ListCommissionsUseCaseRequest,
  ): Promise<ListCommissionsUseCaseResponse> {
    const commissions = await this.commissionsRepository.findManyPaginated({
      tenantId: request.tenantId,
      page: request.page,
      limit: request.limit,
      status: request.status,
      userId: request.userId,
    });

    return { commissions };
  }
}

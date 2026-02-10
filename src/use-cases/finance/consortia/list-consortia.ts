import {
  type ConsortiumDTO,
  consortiumToDTO,
} from '@/mappers/finance/consortium/consortium-to-dto';
import type { ConsortiaRepository } from '@/repositories/finance/consortia-repository';

interface ListConsortiaUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  bankAccountId?: string;
  costCenterId?: string;
  status?: string;
  isContemplated?: boolean;
  search?: string;
}

interface ListConsortiaUseCaseResponse {
  consortia: ConsortiumDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListConsortiaUseCase {
  constructor(private consortiaRepository: ConsortiaRepository) {}

  async execute(
    request: ListConsortiaUseCaseRequest,
  ): Promise<ListConsortiaUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const { consortia, total } = await this.consortiaRepository.findMany({
      tenantId: request.tenantId,
      page,
      limit,
      bankAccountId: request.bankAccountId,
      costCenterId: request.costCenterId,
      status: request.status,
      isContemplated: request.isContemplated,
      search: request.search,
    });

    return {
      consortia: consortia.map(consortiumToDTO),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

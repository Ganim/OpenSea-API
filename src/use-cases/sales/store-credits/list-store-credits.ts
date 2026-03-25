import type { StoreCredit } from '@/entities/sales/store-credit';
import type { StoreCreditsRepository } from '@/repositories/sales/store-credits-repository';

interface ListStoreCreditsUseCaseRequest {
  tenantId: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

interface ListStoreCreditsUseCaseResponse {
  storeCredits: StoreCredit[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListStoreCreditsUseCase {
  constructor(private storeCreditsRepository: StoreCreditsRepository) {}

  async execute(
    request: ListStoreCreditsUseCaseRequest,
  ): Promise<ListStoreCreditsUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const result = await this.storeCreditsRepository.findManyPaginated(
      request.tenantId,
      {
        page,
        limit,
        customerId: request.customerId,
      },
    );

    return {
      storeCredits: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.totalPages,
      },
    };
  }
}

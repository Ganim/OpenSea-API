import type { ReviewCycle } from '@/entities/hr/review-cycle';
import type { ReviewCyclesRepository } from '@/repositories/hr/review-cycles-repository';

export interface ListReviewCyclesRequest {
  tenantId: string;
  type?: string;
  status?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ListReviewCyclesResponse {
  reviewCycles: ReviewCycle[];
  total: number;
}

export class ListReviewCyclesUseCase {
  constructor(private reviewCyclesRepository: ReviewCyclesRepository) {}

  async execute(
    request: ListReviewCyclesRequest,
  ): Promise<ListReviewCyclesResponse> {
    const { tenantId, type, status, isActive, search, page, perPage } =
      request;

    const { reviewCycles, total } =
      await this.reviewCyclesRepository.findMany(tenantId, {
        type,
        status,
        isActive,
        search,
        page,
        perPage,
      });

    return { reviewCycles, total };
  }
}

import type { Coupon } from '@/entities/sales/coupon';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { CouponsRepository } from '@/repositories/sales/coupons-repository';

interface ListCouponsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}

interface ListCouponsUseCaseResponse {
  coupons: PaginatedResult<Coupon>;
}

export class ListCouponsUseCase {
  constructor(private couponsRepository: CouponsRepository) {}

  async execute(
    request: ListCouponsUseCaseRequest,
  ): Promise<ListCouponsUseCaseResponse> {
    const coupons = await this.couponsRepository.findManyPaginated({
      tenantId: request.tenantId,
      page: request.page,
      limit: request.limit,
      search: request.search,
      isActive: request.isActive,
    });

    return { coupons };
  }
}

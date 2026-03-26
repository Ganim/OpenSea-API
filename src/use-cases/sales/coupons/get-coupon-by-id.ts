import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Coupon } from '@/entities/sales/coupon';
import type { CouponsRepository } from '@/repositories/sales/coupons-repository';

interface GetCouponByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetCouponByIdUseCaseResponse {
  coupon: Coupon;
}

export class GetCouponByIdUseCase {
  constructor(private couponsRepository: CouponsRepository) {}

  async execute(
    request: GetCouponByIdUseCaseRequest,
  ): Promise<GetCouponByIdUseCaseResponse> {
    const coupon = await this.couponsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!coupon) {
      throw new ResourceNotFoundError('Coupon not found.');
    }

    return { coupon };
  }
}

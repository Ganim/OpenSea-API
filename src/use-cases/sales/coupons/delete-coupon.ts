import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CouponsRepository } from '@/repositories/sales/coupons-repository';

interface DeleteCouponUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteCouponUseCaseResponse {
  message: string;
}

export class DeleteCouponUseCase {
  constructor(private couponsRepository: CouponsRepository) {}

  async execute(
    request: DeleteCouponUseCaseRequest,
  ): Promise<DeleteCouponUseCaseResponse> {
    const coupon = await this.couponsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!coupon) {
      throw new ResourceNotFoundError('Coupon not found.');
    }

    await this.couponsRepository.delete(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    return { message: 'Coupon deleted successfully.' };
  }
}

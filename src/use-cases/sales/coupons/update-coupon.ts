import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  Coupon,
  CouponApplicableTo,
  CouponDiscountType,
} from '@/entities/sales/coupon';
import type { CouponsRepository } from '@/repositories/sales/coupons-repository';

interface UpdateCouponUseCaseRequest {
  tenantId: string;
  id: string;
  code?: string;
  description?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  applicableTo?: CouponApplicableTo;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

interface UpdateCouponUseCaseResponse {
  coupon: Coupon;
}

export class UpdateCouponUseCase {
  constructor(private couponsRepository: CouponsRepository) {}

  async execute(
    request: UpdateCouponUseCaseRequest,
  ): Promise<UpdateCouponUseCaseResponse> {
    const existing = await this.couponsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Coupon not found.');
    }

    // Check for duplicate code if code is being changed
    if (request.code && request.code.toUpperCase() !== existing.code) {
      const duplicateCoupon = await this.couponsRepository.findByCode(
        request.code.toUpperCase(),
        request.tenantId,
      );

      if (duplicateCoupon) {
        throw new ConflictError('A coupon with this code already exists.');
      }
    }

    const coupon = await this.couponsRepository.update({
      id: new UniqueEntityID(request.id),
      tenantId: request.tenantId,
      code: request.code,
      description: request.description,
      discountType: request.discountType,
      discountValue: request.discountValue,
      applicableTo: request.applicableTo,
      minOrderValue: request.minOrderValue,
      maxDiscountAmount: request.maxDiscountAmount,
      maxUsageTotal: request.maxUsageTotal,
      maxUsagePerCustomer: request.maxUsagePerCustomer,
      startDate: request.startDate,
      endDate: request.endDate,
      isActive: request.isActive,
    });

    if (!coupon) {
      throw new ResourceNotFoundError('Coupon not found.');
    }

    return { coupon };
  }
}

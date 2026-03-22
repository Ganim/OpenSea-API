import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import type {
  Coupon,
  CouponApplicableTo,
  CouponDiscountType,
} from '@/entities/sales/coupon';
import type { CouponsRepository } from '@/repositories/sales/coupons-repository';

interface CreateCouponUseCaseRequest {
  tenantId: string;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  applicableTo: CouponApplicableTo;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  startDate?: Date;
  endDate?: Date;
  productIds?: string[];
  categoryIds?: string[];
  customerIds?: string[];
}

interface CreateCouponUseCaseResponse {
  coupon: Coupon;
}

export class CreateCouponUseCase {
  constructor(private couponsRepository: CouponsRepository) {}

  async execute(
    request: CreateCouponUseCaseRequest,
  ): Promise<CreateCouponUseCaseResponse> {
    if (!request.code || request.code.trim().length === 0) {
      throw new BadRequestError('Coupon code is required.');
    }

    if (
      request.startDate &&
      request.endDate &&
      request.endDate < request.startDate
    ) {
      throw new BadRequestError('End date must be after start date.');
    }

    const existingCoupon = await this.couponsRepository.findByCode(
      request.code.toUpperCase(),
      request.tenantId,
    );

    if (existingCoupon) {
      throw new ConflictError('A coupon with this code already exists.');
    }

    const coupon = await this.couponsRepository.create({
      tenantId: request.tenantId,
      code: request.code.toUpperCase().trim(),
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
      productIds: request.productIds,
      categoryIds: request.categoryIds,
      customerIds: request.customerIds,
    });

    return { coupon };
  }
}

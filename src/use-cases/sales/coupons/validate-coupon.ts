import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { Coupon } from '@/entities/sales/coupon';
import type { CouponsRepository } from '@/repositories/sales/coupons-repository';

interface ValidateCouponUseCaseRequest {
  tenantId: string;
  code: string;
  customerId?: string;
  orderValue?: number;
  productIds?: string[];
  categoryIds?: string[];
}

interface ValidateCouponUseCaseResponse {
  coupon: Coupon;
  discountType: string;
  discountValue: number;
  isValid: boolean;
}

export class ValidateCouponUseCase {
  constructor(private couponsRepository: CouponsRepository) {}

  async execute(
    request: ValidateCouponUseCaseRequest,
  ): Promise<ValidateCouponUseCaseResponse> {
    // 1. Code exists?
    const coupon = await this.couponsRepository.findByCode(
      request.code.toUpperCase(),
      request.tenantId,
    );

    if (!coupon) {
      throw new ResourceNotFoundError('Coupon not found.');
    }

    // 2. isActive?
    if (!coupon.isActive) {
      throw new BadRequestError('Coupon is inactive.');
    }

    // 3. Within valid dates?
    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      throw new BadRequestError('Coupon is not yet valid.');
    }
    if (coupon.endDate && now > coupon.endDate) {
      throw new BadRequestError('Coupon has expired.');
    }

    // 4. maxUsageTotal not exceeded?
    if (
      coupon.maxUsageTotal !== undefined &&
      coupon.currentUsageTotal >= coupon.maxUsageTotal
    ) {
      throw new BadRequestError('Coupon usage limit has been reached.');
    }

    // 5. maxUsagePerCustomer not exceeded?
    if (request.customerId && coupon.maxUsagePerCustomer !== undefined) {
      const customerUsageCount = coupon.getUsageCountForCustomer(
        request.customerId,
      );
      if (customerUsageCount >= coupon.maxUsagePerCustomer) {
        throw new BadRequestError(
          'Coupon usage limit for this customer has been reached.',
        );
      }
    }

    // 6. minOrderValue met?
    if (
      coupon.minOrderValue !== undefined &&
      request.orderValue !== undefined &&
      request.orderValue < coupon.minOrderValue
    ) {
      throw new BadRequestError(
        `Minimum order value of ${coupon.minOrderValue} is required.`,
      );
    }

    // 7. applicableTo check
    switch (coupon.applicableTo) {
      case 'SPECIFIC_PRODUCTS': {
        if (
          request.productIds &&
          request.productIds.length > 0 &&
          coupon.productIds.length > 0
        ) {
          const hasMatch = request.productIds.some((pid) =>
            coupon.productIds.includes(pid),
          );
          if (!hasMatch) {
            throw new BadRequestError(
              'Coupon is not applicable to the selected products.',
            );
          }
        }
        break;
      }
      case 'SPECIFIC_CATEGORIES': {
        if (
          request.categoryIds &&
          request.categoryIds.length > 0 &&
          coupon.categoryIds.length > 0
        ) {
          const hasMatch = request.categoryIds.some((cid) =>
            coupon.categoryIds.includes(cid),
          );
          if (!hasMatch) {
            throw new BadRequestError(
              'Coupon is not applicable to the selected categories.',
            );
          }
        }
        break;
      }
      case 'SPECIFIC_CUSTOMERS': {
        if (
          request.customerId &&
          coupon.customerIds.length > 0 &&
          !coupon.customerIds.includes(request.customerId)
        ) {
          throw new BadRequestError(
            'Coupon is not applicable to this customer.',
          );
        }
        break;
      }
      case 'ALL':
      default:
        break;
    }

    return {
      coupon,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      isValid: true,
    };
  }
}

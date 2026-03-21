import { PrismaCouponsRepository } from '@/repositories/sales/prisma/prisma-coupons-repository';
import { ValidateCouponUseCase } from '../validate-coupon';

export function makeValidateCouponUseCase() {
  const couponsRepository = new PrismaCouponsRepository();
  return new ValidateCouponUseCase(couponsRepository);
}

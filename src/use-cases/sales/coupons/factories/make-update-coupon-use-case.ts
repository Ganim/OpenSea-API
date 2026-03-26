import { PrismaCouponsRepository } from '@/repositories/sales/prisma/prisma-coupons-repository';
import { UpdateCouponUseCase } from '../update-coupon';

export function makeUpdateCouponUseCase() {
  const couponsRepository = new PrismaCouponsRepository();
  return new UpdateCouponUseCase(couponsRepository);
}

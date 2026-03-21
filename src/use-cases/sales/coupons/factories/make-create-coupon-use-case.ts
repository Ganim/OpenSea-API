import { PrismaCouponsRepository } from '@/repositories/sales/prisma/prisma-coupons-repository';
import { CreateCouponUseCase } from '../create-coupon';

export function makeCreateCouponUseCase() {
  const couponsRepository = new PrismaCouponsRepository();
  return new CreateCouponUseCase(couponsRepository);
}

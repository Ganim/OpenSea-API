import { PrismaCouponsRepository } from '@/repositories/sales/prisma/prisma-coupons-repository';
import { GetCouponByIdUseCase } from '../get-coupon-by-id';

export function makeGetCouponByIdUseCase() {
  const couponsRepository = new PrismaCouponsRepository();
  return new GetCouponByIdUseCase(couponsRepository);
}

import { PrismaCouponsRepository } from '@/repositories/sales/prisma/prisma-coupons-repository';
import { DeleteCouponUseCase } from '../delete-coupon';

export function makeDeleteCouponUseCase() {
  const couponsRepository = new PrismaCouponsRepository();
  return new DeleteCouponUseCase(couponsRepository);
}

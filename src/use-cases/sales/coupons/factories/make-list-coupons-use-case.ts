import { PrismaCouponsRepository } from '@/repositories/sales/prisma/prisma-coupons-repository';
import { ListCouponsUseCase } from '../list-coupons';

export function makeListCouponsUseCase() {
  const couponsRepository = new PrismaCouponsRepository();
  return new ListCouponsUseCase(couponsRepository);
}

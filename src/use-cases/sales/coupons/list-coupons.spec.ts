import { InMemoryCouponsRepository } from '@/repositories/sales/in-memory/in-memory-coupons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCouponUseCase } from './create-coupon';
import { ListCouponsUseCase } from './list-coupons';

let couponsRepository: InMemoryCouponsRepository;
let createCoupon: CreateCouponUseCase;
let sut: ListCouponsUseCase;

describe('List Coupons Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    couponsRepository = new InMemoryCouponsRepository();
    createCoupon = new CreateCouponUseCase(couponsRepository);
    sut = new ListCouponsUseCase(couponsRepository);
  });

  it('should list coupons', async () => {
    await createCoupon.execute({
      tenantId: TENANT_ID,
      code: 'COUPON1',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    await createCoupon.execute({
      tenantId: TENANT_ID,
      code: 'COUPON2',
      discountType: 'FIXED_AMOUNT',
      discountValue: 50,
      applicableTo: 'ALL',
    });

    const { coupons } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(coupons.data).toHaveLength(2);
    expect(coupons.total).toBe(2);
  });
});

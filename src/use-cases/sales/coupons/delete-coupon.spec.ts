import { InMemoryCouponsRepository } from '@/repositories/sales/in-memory/in-memory-coupons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCouponUseCase } from './create-coupon';
import { DeleteCouponUseCase } from './delete-coupon';

let couponsRepository: InMemoryCouponsRepository;
let createCoupon: CreateCouponUseCase;
let sut: DeleteCouponUseCase;

describe('Delete Coupon Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    couponsRepository = new InMemoryCouponsRepository();
    createCoupon = new CreateCouponUseCase(couponsRepository);
    sut = new DeleteCouponUseCase(couponsRepository);
  });

  it('should delete a coupon', async () => {
    const { coupon: created } = await createCoupon.execute({
      tenantId: TENANT_ID,
      code: 'DELETE_ME',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: created.couponId.toString(),
    });

    expect(result.message).toBe('Coupon deleted successfully.');

    const found = await couponsRepository.findById(
      created.couponId,
      TENANT_ID,
    );
    expect(found).toBeNull();
  });
});

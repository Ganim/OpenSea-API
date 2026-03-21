import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { InMemoryCouponsRepository } from '@/repositories/sales/in-memory/in-memory-coupons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCouponUseCase } from './create-coupon';

let couponsRepository: InMemoryCouponsRepository;
let sut: CreateCouponUseCase;

describe('Create Coupon Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    couponsRepository = new InMemoryCouponsRepository();
    sut = new CreateCouponUseCase(couponsRepository);
  });

  it('should create a coupon', async () => {
    const { coupon } = await sut.execute({
      tenantId: TENANT_ID,
      code: 'SUMMER20',
      description: '20% off summer sale',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      applicableTo: 'ALL',
    });

    expect(coupon.couponId.toString()).toEqual(expect.any(String));
    expect(coupon.code).toBe('SUMMER20');
    expect(coupon.discountType).toBe('PERCENTAGE');
    expect(coupon.discountValue).toBe(20);
    expect(coupon.isActive).toBe(true);
  });

  it('should not create a coupon with duplicate code', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      code: 'SUMMER20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      applicableTo: 'ALL',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'SUMMER20',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        applicableTo: 'ALL',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('should not create a coupon with end date before start date', async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 86400000);

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'INVALID',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        applicableTo: 'ALL',
        startDate: now,
        endDate: pastDate,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});

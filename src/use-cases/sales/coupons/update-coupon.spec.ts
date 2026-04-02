import { InMemoryCouponsRepository } from '@/repositories/sales/in-memory/in-memory-coupons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateCouponUseCase } from './update-coupon';

let couponsRepository: InMemoryCouponsRepository;
let sut: UpdateCouponUseCase;

describe('UpdateCouponUseCase', () => {
  beforeEach(() => {
    couponsRepository = new InMemoryCouponsRepository();
    sut = new UpdateCouponUseCase(couponsRepository);
  });

  it('should update coupon fields', async () => {
    const coupon = await couponsRepository.create({
      tenantId: 'tenant-1',
      code: 'SAVE10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: coupon.id.toString(),
      description: 'Updated description',
      isActive: false,
    });

    expect(result.coupon).toBeTruthy();
    expect(result.coupon.isActive).toBe(false);
  });

  it('should throw if coupon is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        description: 'Test',
      }),
    ).rejects.toThrow('Coupon not found.');
  });

  it('should throw if new code already exists', async () => {
    await couponsRepository.create({
      tenantId: 'tenant-1',
      code: 'EXISTING',
      discountType: 'PERCENTAGE',
      discountValue: 5,
      applicableTo: 'ALL',
    });

    const coupon = await couponsRepository.create({
      tenantId: 'tenant-1',
      code: 'ORIGINAL',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: coupon.id.toString(),
        code: 'EXISTING',
      }),
    ).rejects.toThrow('A coupon with this code already exists.');
  });

  it('should allow updating to the same code', async () => {
    const coupon = await couponsRepository.create({
      tenantId: 'tenant-1',
      code: 'SAVE10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: coupon.id.toString(),
      code: 'SAVE10',
    });

    expect(result.coupon).toBeTruthy();
  });
});

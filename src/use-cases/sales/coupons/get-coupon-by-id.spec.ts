import { InMemoryCouponsRepository } from '@/repositories/sales/in-memory/in-memory-coupons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetCouponByIdUseCase } from './get-coupon-by-id';

let couponsRepository: InMemoryCouponsRepository;
let sut: GetCouponByIdUseCase;

describe('GetCouponByIdUseCase', () => {
  beforeEach(() => {
    couponsRepository = new InMemoryCouponsRepository();
    sut = new GetCouponByIdUseCase(couponsRepository);
  });

  it('should return a coupon by id', async () => {
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
    });

    expect(result.coupon).toBeTruthy();
    expect(result.coupon.code).toBe('SAVE10');
  });

  it('should throw if coupon is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
      }),
    ).rejects.toThrow('Coupon not found.');
  });

  it('should throw if coupon belongs to another tenant', async () => {
    const coupon = await couponsRepository.create({
      tenantId: 'tenant-1',
      code: 'SAVE10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-2',
        id: coupon.id.toString(),
      }),
    ).rejects.toThrow('Coupon not found.');
  });
});

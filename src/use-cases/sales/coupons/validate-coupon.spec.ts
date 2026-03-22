import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Coupon } from '@/entities/sales/coupon';
import { InMemoryCouponsRepository } from '@/repositories/sales/in-memory/in-memory-coupons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ValidateCouponUseCase } from './validate-coupon';

let couponsRepository: InMemoryCouponsRepository;
let sut: ValidateCouponUseCase;

describe('Validate Coupon Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    couponsRepository = new InMemoryCouponsRepository();
    sut = new ValidateCouponUseCase(couponsRepository);
  });

  function createCoupon(
    overrides: Partial<Parameters<typeof Coupon.create>[0]> = {},
  ): Coupon {
    const coupon = Coupon.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      code: 'SUMMER20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      applicableTo: 'ALL',
      isActive: true,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000 * 30),
      ...overrides,
    });
    couponsRepository.items.push(coupon);
    return coupon;
  }

  // VALID

  it('should validate a valid coupon', async () => {
    createCoupon();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: 'SUMMER20',
      orderValue: 100,
    });

    expect(result.isValid).toBe(true);
    expect(result.discountType).toBe('PERCENTAGE');
    expect(result.discountValue).toBe(20);
  });

  // NOT FOUND

  it('should reject coupon that does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'NONEXISTENT',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  // INACTIVE

  it('should reject inactive coupon', async () => {
    createCoupon({ isActive: false });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'SUMMER20',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // EXPIRED

  it('should reject expired coupon', async () => {
    createCoupon({
      startDate: new Date(Date.now() - 86400000 * 60),
      endDate: new Date(Date.now() - 86400000),
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'SUMMER20',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // NOT YET VALID

  it('should reject coupon that is not yet valid', async () => {
    createCoupon({
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 86400000 * 30),
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'SUMMER20',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // USAGE EXCEEDED (total)

  it('should reject coupon when total usage exceeded', async () => {
    createCoupon({
      maxUsageTotal: 5,
      currentUsageTotal: 5,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'SUMMER20',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // USAGE EXCEEDED (per customer)

  it('should reject coupon when per-customer usage exceeded', async () => {
    const customerId = 'customer-1';
    const coupon = createCoupon({ maxUsagePerCustomer: 1 });

    // Simulate one usage by this customer
    coupon.props.usages.push({
      id: new UniqueEntityID(),
      couponId: coupon.couponId,
      customerId: new UniqueEntityID(customerId),
      discountApplied: 20,
      usedAt: new Date(),
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'SUMMER20',
        customerId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // MIN ORDER VALUE NOT MET

  it('should reject coupon when min order value not met', async () => {
    createCoupon({ minOrderValue: 100 });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'SUMMER20',
        orderValue: 50,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // APPLICABLE TO: SPECIFIC_PRODUCTS

  it('should reject coupon not applicable to products', async () => {
    createCoupon({
      applicableTo: 'SPECIFIC_PRODUCTS',
      productIds: ['product-1', 'product-2'],
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'SUMMER20',
        productIds: ['product-999'],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should accept coupon applicable to matching products', async () => {
    createCoupon({
      applicableTo: 'SPECIFIC_PRODUCTS',
      productIds: ['product-1', 'product-2'],
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: 'SUMMER20',
      productIds: ['product-1'],
    });

    expect(result.isValid).toBe(true);
  });

  // APPLICABLE TO: SPECIFIC_CATEGORIES

  it('should reject coupon not applicable to categories', async () => {
    createCoupon({
      applicableTo: 'SPECIFIC_CATEGORIES',
      categoryIds: ['cat-1'],
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'SUMMER20',
        categoryIds: ['cat-999'],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // APPLICABLE TO: SPECIFIC_CUSTOMERS

  it('should reject coupon not applicable to customer', async () => {
    createCoupon({
      applicableTo: 'SPECIFIC_CUSTOMERS',
      customerIds: ['customer-1'],
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'SUMMER20',
        customerId: 'customer-999',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should accept coupon applicable to matching customer', async () => {
    createCoupon({
      applicableTo: 'SPECIFIC_CUSTOMERS',
      customerIds: ['customer-1'],
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: 'SUMMER20',
      customerId: 'customer-1',
    });

    expect(result.isValid).toBe(true);
  });
});

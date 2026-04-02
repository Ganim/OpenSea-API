import { InMemoryDiscountRulesRepository } from '@/repositories/sales/in-memory/in-memory-discount-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ValidateDiscountUseCase } from './validate-discount';

let discountRulesRepository: InMemoryDiscountRulesRepository;
let validateDiscount: ValidateDiscountUseCase;

describe('ValidateDiscountUseCase', () => {
  beforeEach(() => {
    discountRulesRepository = new InMemoryDiscountRulesRepository();
    validateDiscount = new ValidateDiscountUseCase(discountRulesRepository);
  });

  it('should return applicable percentage discount', async () => {
    await discountRulesRepository.create({
      tenantId: 'tenant-1',
      name: '10% Off',
      type: 'PERCENTAGE',
      value: 10,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    });

    const result = await validateDiscount.execute({
      tenantId: 'tenant-1',
      cartItems: [{ productId: 'prod-1', quantity: 2, unitPrice: 50 }],
    });

    expect(result.applicableDiscounts).toHaveLength(1);
    expect(result.applicableDiscounts[0].calculatedDiscount).toBe(10);
    expect(result.totalDiscount).toBe(10);
  });

  it('should return applicable fixed amount discount', async () => {
    await discountRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Flat 20 Off',
      type: 'FIXED_AMOUNT',
      value: 20,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    });

    const result = await validateDiscount.execute({
      tenantId: 'tenant-1',
      cartItems: [{ productId: 'prod-1', quantity: 1, unitPrice: 100 }],
    });

    expect(result.applicableDiscounts).toHaveLength(1);
    expect(result.applicableDiscounts[0].calculatedDiscount).toBe(20);
  });

  it('should filter by minimum order value', async () => {
    await discountRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Min Order Discount',
      type: 'PERCENTAGE',
      value: 10,
      minOrderValue: 200,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    });

    const resultBelow = await validateDiscount.execute({
      tenantId: 'tenant-1',
      cartItems: [{ productId: 'prod-1', quantity: 1, unitPrice: 100 }],
    });

    expect(resultBelow.applicableDiscounts).toHaveLength(0);

    const resultAbove = await validateDiscount.execute({
      tenantId: 'tenant-1',
      cartItems: [{ productId: 'prod-1', quantity: 3, unitPrice: 100 }],
    });

    expect(resultAbove.applicableDiscounts).toHaveLength(1);
  });

  it('should filter by minimum quantity', async () => {
    await discountRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Bulk Discount',
      type: 'PERCENTAGE',
      value: 15,
      minQuantity: 5,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    });

    const result = await validateDiscount.execute({
      tenantId: 'tenant-1',
      cartItems: [{ productId: 'prod-1', quantity: 2, unitPrice: 50 }],
    });

    expect(result.applicableDiscounts).toHaveLength(0);
  });

  it('should filter by customer restriction', async () => {
    await discountRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'VIP Discount',
      type: 'PERCENTAGE',
      value: 20,
      customerId: 'cust-vip',
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    });

    const resultWrongCustomer = await validateDiscount.execute({
      tenantId: 'tenant-1',
      customerId: 'cust-regular',
      cartItems: [{ productId: 'prod-1', quantity: 1, unitPrice: 100 }],
    });

    expect(resultWrongCustomer.applicableDiscounts).toHaveLength(0);

    const resultRightCustomer = await validateDiscount.execute({
      tenantId: 'tenant-1',
      customerId: 'cust-vip',
      cartItems: [{ productId: 'prod-1', quantity: 1, unitPrice: 100 }],
    });

    expect(resultRightCustomer.applicableDiscounts).toHaveLength(1);
  });

  it('should handle non-stackable discounts correctly', async () => {
    await discountRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'High Priority Non-Stackable',
      type: 'PERCENTAGE',
      value: 10,
      priority: 10,
      isStackable: false,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    });

    await discountRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Low Priority Non-Stackable',
      type: 'PERCENTAGE',
      value: 5,
      priority: 1,
      isStackable: false,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    });

    const result = await validateDiscount.execute({
      tenantId: 'tenant-1',
      cartItems: [{ productId: 'prod-1', quantity: 1, unitPrice: 100 }],
    });

    // Only the highest priority non-stackable should apply
    expect(result.applicableDiscounts).toHaveLength(1);
    expect(result.applicableDiscounts[0].ruleName).toBe(
      'High Priority Non-Stackable',
    );
  });

  it('should return empty when no active rules exist', async () => {
    const result = await validateDiscount.execute({
      tenantId: 'tenant-1',
      cartItems: [{ productId: 'prod-1', quantity: 1, unitPrice: 100 }],
    });

    expect(result.applicableDiscounts).toHaveLength(0);
    expect(result.totalDiscount).toBe(0);
  });
});

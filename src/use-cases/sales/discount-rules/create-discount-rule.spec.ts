import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryDiscountRulesRepository } from '@/repositories/sales/in-memory/in-memory-discount-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDiscountRuleUseCase } from './create-discount-rule';

let discountRulesRepository: InMemoryDiscountRulesRepository;
let createDiscountRule: CreateDiscountRuleUseCase;

describe('CreateDiscountRuleUseCase', () => {
  beforeEach(() => {
    discountRulesRepository = new InMemoryDiscountRulesRepository();
    createDiscountRule = new CreateDiscountRuleUseCase(discountRulesRepository);
  });

  it('should create a percentage discount rule', async () => {
    const result = await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: 'Summer Sale',
      type: 'PERCENTAGE',
      value: 10,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    expect(result.discountRule).toBeDefined();
    expect(result.discountRule.name).toBe('Summer Sale');
    expect(result.discountRule.type).toBe('PERCENTAGE');
    expect(result.discountRule.value).toBe(10);
    expect(result.discountRule.isActive).toBe(true);
  });

  it('should create a fixed amount discount rule', async () => {
    const result = await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: 'Flat Discount',
      type: 'FIXED_AMOUNT',
      value: 50,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    expect(result.discountRule.type).toBe('FIXED_AMOUNT');
    expect(result.discountRule.value).toBe(50);
  });

  it('should create a discount rule with all optional fields', async () => {
    const result = await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: 'VIP Discount',
      description: 'Special discount for VIP customers',
      type: 'PERCENTAGE',
      value: 15,
      minOrderValue: 100,
      minQuantity: 3,
      categoryId: 'cat-1',
      productId: 'prod-1',
      customerId: 'cust-1',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      priority: 5,
      isStackable: true,
    });

    expect(result.discountRule.minOrderValue).toBe(100);
    expect(result.discountRule.minQuantity).toBe(3);
    expect(result.discountRule.categoryId).toBe('cat-1');
    expect(result.discountRule.productId).toBe('prod-1');
    expect(result.discountRule.customerId).toBe('cust-1');
    expect(result.discountRule.priority).toBe(5);
    expect(result.discountRule.isStackable).toBe(true);
  });

  it('should not allow empty name', async () => {
    await expect(() =>
      createDiscountRule.execute({
        tenantId: 'tenant-1',
        name: '',
        type: 'PERCENTAGE',
        value: 10,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow value of zero', async () => {
    await expect(() =>
      createDiscountRule.execute({
        tenantId: 'tenant-1',
        name: 'Bad Discount',
        type: 'PERCENTAGE',
        value: 0,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow percentage discount exceeding 100', async () => {
    await expect(() =>
      createDiscountRule.execute({
        tenantId: 'tenant-1',
        name: 'Too High',
        type: 'PERCENTAGE',
        value: 150,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow end date before start date', async () => {
    await expect(() =>
      createDiscountRule.execute({
        tenantId: 'tenant-1',
        name: 'Invalid Dates',
        type: 'PERCENTAGE',
        value: 10,
        startDate: '2026-12-31',
        endDate: '2026-01-01',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should trim name', async () => {
    const result = await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: '  Trimmed Name  ',
      type: 'PERCENTAGE',
      value: 10,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    expect(result.discountRule.name).toBe('Trimmed Name');
  });
});

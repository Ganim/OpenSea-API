import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDiscountRulesRepository } from '@/repositories/sales/in-memory/in-memory-discount-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDiscountRuleUseCase } from './create-discount-rule';
import { UpdateDiscountRuleUseCase } from './update-discount-rule';

let discountRulesRepository: InMemoryDiscountRulesRepository;
let createDiscountRule: CreateDiscountRuleUseCase;
let updateDiscountRule: UpdateDiscountRuleUseCase;

describe('UpdateDiscountRuleUseCase', () => {
  beforeEach(() => {
    discountRulesRepository = new InMemoryDiscountRulesRepository();
    createDiscountRule = new CreateDiscountRuleUseCase(discountRulesRepository);
    updateDiscountRule = new UpdateDiscountRuleUseCase(discountRulesRepository);
  });

  it('should update discount rule name', async () => {
    const { discountRule } = await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: 'Original Name',
      type: 'PERCENTAGE',
      value: 10,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    const result = await updateDiscountRule.execute({
      tenantId: 'tenant-1',
      id: discountRule.id,
      name: 'Updated Name',
    });

    expect(result.discountRule.name).toBe('Updated Name');
  });

  it('should update discount value and type', async () => {
    const { discountRule } = await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: 'Test Rule',
      type: 'PERCENTAGE',
      value: 10,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    const result = await updateDiscountRule.execute({
      tenantId: 'tenant-1',
      id: discountRule.id,
      type: 'FIXED_AMOUNT',
      value: 25,
    });

    expect(result.discountRule.type).toBe('FIXED_AMOUNT');
    expect(result.discountRule.value).toBe(25);
  });

  it('should throw when discount rule not found', async () => {
    await expect(() =>
      updateDiscountRule.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
        name: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow empty name', async () => {
    const { discountRule } = await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: 'Test',
      type: 'PERCENTAGE',
      value: 10,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    await expect(() =>
      updateDiscountRule.execute({
        tenantId: 'tenant-1',
        id: discountRule.id,
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow percentage over 100', async () => {
    const { discountRule } = await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: 'Test',
      type: 'PERCENTAGE',
      value: 10,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    await expect(() =>
      updateDiscountRule.execute({
        tenantId: 'tenant-1',
        id: discountRule.id,
        value: 150,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});

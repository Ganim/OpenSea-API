import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDiscountRulesRepository } from '@/repositories/sales/in-memory/in-memory-discount-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDiscountRuleUseCase } from './create-discount-rule';
import { DeleteDiscountRuleUseCase } from './delete-discount-rule';

let discountRulesRepository: InMemoryDiscountRulesRepository;
let createDiscountRule: CreateDiscountRuleUseCase;
let deleteDiscountRule: DeleteDiscountRuleUseCase;

describe('DeleteDiscountRuleUseCase', () => {
  beforeEach(() => {
    discountRulesRepository = new InMemoryDiscountRulesRepository();
    createDiscountRule = new CreateDiscountRuleUseCase(discountRulesRepository);
    deleteDiscountRule = new DeleteDiscountRuleUseCase(discountRulesRepository);
  });

  it('should soft delete a discount rule', async () => {
    const { discountRule } = await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: 'To Delete',
      type: 'PERCENTAGE',
      value: 10,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    const result = await deleteDiscountRule.execute({
      tenantId: 'tenant-1',
      id: discountRule.id,
    });

    expect(result.message).toBe('Discount rule deleted successfully.');
    expect(discountRulesRepository.items[0].deletedAt).toBeDefined();
    expect(discountRulesRepository.items[0].isActive).toBe(false);
  });

  it('should throw when discount rule not found', async () => {
    await expect(() =>
      deleteDiscountRule.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});

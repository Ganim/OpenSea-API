import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDiscountRulesRepository } from '@/repositories/sales/in-memory/in-memory-discount-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDiscountRuleUseCase } from './create-discount-rule';
import { GetDiscountRuleByIdUseCase } from './get-discount-rule-by-id';

let discountRulesRepository: InMemoryDiscountRulesRepository;
let createDiscountRule: CreateDiscountRuleUseCase;
let getDiscountRuleById: GetDiscountRuleByIdUseCase;

describe('GetDiscountRuleByIdUseCase', () => {
  beforeEach(() => {
    discountRulesRepository = new InMemoryDiscountRulesRepository();
    createDiscountRule = new CreateDiscountRuleUseCase(discountRulesRepository);
    getDiscountRuleById = new GetDiscountRuleByIdUseCase(
      discountRulesRepository,
    );
  });

  it('should return a discount rule by id', async () => {
    const { discountRule: created } = await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: 'Find Me',
      type: 'PERCENTAGE',
      value: 15,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    const result = await getDiscountRuleById.execute({
      tenantId: 'tenant-1',
      id: created.id,
    });

    expect(result.discountRule.name).toBe('Find Me');
    expect(result.discountRule.value).toBe(15);
  });

  it('should throw when discount rule not found', async () => {
    await expect(() =>
      getDiscountRuleById.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});

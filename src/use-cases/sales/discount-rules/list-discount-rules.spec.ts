import { InMemoryDiscountRulesRepository } from '@/repositories/sales/in-memory/in-memory-discount-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDiscountRuleUseCase } from './create-discount-rule';
import { ListDiscountRulesUseCase } from './list-discount-rules';

let discountRulesRepository: InMemoryDiscountRulesRepository;
let createDiscountRule: CreateDiscountRuleUseCase;
let listDiscountRules: ListDiscountRulesUseCase;

describe('ListDiscountRulesUseCase', () => {
  beforeEach(() => {
    discountRulesRepository = new InMemoryDiscountRulesRepository();
    createDiscountRule = new CreateDiscountRuleUseCase(discountRulesRepository);
    listDiscountRules = new ListDiscountRulesUseCase(discountRulesRepository);
  });

  it('should list discount rules with pagination', async () => {
    for (let i = 1; i <= 5; i++) {
      await createDiscountRule.execute({
        tenantId: 'tenant-1',
        name: `Rule ${i}`,
        type: 'PERCENTAGE',
        value: i * 5,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });
    }

    const result = await listDiscountRules.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 3,
    });

    expect(result.discountRules).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no discount rules exist', async () => {
    const result = await listDiscountRules.execute({
      tenantId: 'tenant-1',
    });

    expect(result.discountRules).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should only list rules for the given tenant', async () => {
    await createDiscountRule.execute({
      tenantId: 'tenant-1',
      name: 'Tenant 1 Rule',
      type: 'PERCENTAGE',
      value: 10,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    await createDiscountRule.execute({
      tenantId: 'tenant-2',
      name: 'Tenant 2 Rule',
      type: 'PERCENTAGE',
      value: 20,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    const result = await listDiscountRules.execute({
      tenantId: 'tenant-1',
    });

    expect(result.discountRules).toHaveLength(1);
    expect(result.discountRules[0].name).toBe('Tenant 1 Rule');
  });
});

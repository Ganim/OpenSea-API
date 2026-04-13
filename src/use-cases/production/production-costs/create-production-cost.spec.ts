import { InMemoryProductionCostsRepository } from '@/repositories/production/in-memory/in-memory-production-costs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductionCostUseCase } from './create-production-cost';

let productionCostsRepository: InMemoryProductionCostsRepository;
let sut: CreateProductionCostUseCase;

describe('CreateProductionCostUseCase', () => {
  beforeEach(() => {
    productionCostsRepository = new InMemoryProductionCostsRepository();
    sut = new CreateProductionCostUseCase(productionCostsRepository);
  });

  it('should create a production cost', async () => {
    const { cost } = await sut.execute({
      productionOrderId: 'order-1',
      costType: 'MATERIAL',
      description: 'Raw materials',
      plannedAmount: 1000,
      actualAmount: 1200,
    });

    expect(cost.id.toString()).toEqual(expect.any(String));
    expect(cost.productionOrderId.toString()).toBe('order-1');
    expect(cost.costType).toBe('MATERIAL');
    expect(cost.description).toBe('Raw materials');
    expect(cost.plannedAmount).toBe(1000);
    expect(cost.actualAmount).toBe(1200);
    expect(cost.varianceAmount).toBe(200);
  });

  it('should calculate negative variance when under budget', async () => {
    const { cost } = await sut.execute({
      productionOrderId: 'order-1',
      costType: 'LABOR',
      plannedAmount: 500,
      actualAmount: 400,
    });

    expect(cost.varianceAmount).toBe(-100);
  });

  it('should create with all cost types', async () => {
    const costTypes = ['MATERIAL', 'LABOR', 'OVERHEAD'] as const;

    for (const costType of costTypes) {
      const { cost } = await sut.execute({
        productionOrderId: 'order-1',
        costType,
        plannedAmount: 100,
        actualAmount: 100,
      });

      expect(cost.costType).toBe(costType);
    }
  });

  it('should create a cost without description', async () => {
    const { cost } = await sut.execute({
      productionOrderId: 'order-1',
      costType: 'OVERHEAD',
      plannedAmount: 300,
      actualAmount: 300,
    });

    expect(cost.description).toBeNull();
  });
});

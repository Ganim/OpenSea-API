import { InMemoryProductionCostsRepository } from '@/repositories/production/in-memory/in-memory-production-costs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductionCostUseCase } from './create-production-cost';
import { ListProductionCostsUseCase } from './list-production-costs';

let productionCostsRepository: InMemoryProductionCostsRepository;
let createProductionCost: CreateProductionCostUseCase;
let sut: ListProductionCostsUseCase;

describe('ListProductionCostsUseCase', () => {
  beforeEach(() => {
    productionCostsRepository = new InMemoryProductionCostsRepository();
    createProductionCost = new CreateProductionCostUseCase(
      productionCostsRepository,
    );
    sut = new ListProductionCostsUseCase(productionCostsRepository);
  });

  it('should return empty list when no costs exist', async () => {
    const { costs } = await sut.execute({
      productionOrderId: 'order-1',
    });

    expect(costs).toHaveLength(0);
  });

  it('should list costs for a production order', async () => {
    await createProductionCost.execute({
      productionOrderId: 'order-1',
      costType: 'MATERIAL',
      plannedAmount: 1000,
      actualAmount: 1200,
    });

    await createProductionCost.execute({
      productionOrderId: 'order-1',
      costType: 'LABOR',
      plannedAmount: 500,
      actualAmount: 450,
    });

    await createProductionCost.execute({
      productionOrderId: 'order-2',
      costType: 'OVERHEAD',
      plannedAmount: 200,
      actualAmount: 200,
    });

    const { costs } = await sut.execute({
      productionOrderId: 'order-1',
    });

    expect(costs).toHaveLength(2);
  });
});

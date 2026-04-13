import { InMemoryProductionCostsRepository } from '@/repositories/production/in-memory/in-memory-production-costs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateOrderCostUseCase } from './calculate-order-cost';
import { CreateProductionCostUseCase } from './create-production-cost';

let productionCostsRepository: InMemoryProductionCostsRepository;
let createProductionCost: CreateProductionCostUseCase;
let sut: CalculateOrderCostUseCase;

describe('CalculateOrderCostUseCase', () => {
  beforeEach(() => {
    productionCostsRepository = new InMemoryProductionCostsRepository();
    createProductionCost = new CreateProductionCostUseCase(
      productionCostsRepository,
    );
    sut = new CalculateOrderCostUseCase(productionCostsRepository);
  });

  it('should return zero totals when no costs exist', async () => {
    const result = await sut.execute({
      productionOrderId: 'order-1',
    });

    expect(result.totalPlanned).toBe(0);
    expect(result.totalActual).toBe(0);
    expect(result.totalVariance).toBe(0);
    expect(result.details).toHaveLength(0);
  });

  it('should calculate totals from multiple costs', async () => {
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
      actualAmount: 400,
    });

    await createProductionCost.execute({
      productionOrderId: 'order-1',
      costType: 'OVERHEAD',
      plannedAmount: 300,
      actualAmount: 350,
    });

    const result = await sut.execute({
      productionOrderId: 'order-1',
    });

    expect(result.totalPlanned).toBe(1800);
    expect(result.totalActual).toBe(1950);
    expect(result.totalVariance).toBe(150); // (200) + (-100) + (50)
    expect(result.details).toHaveLength(3);
  });

  it('should not include costs from other orders', async () => {
    await createProductionCost.execute({
      productionOrderId: 'order-1',
      costType: 'MATERIAL',
      plannedAmount: 1000,
      actualAmount: 1000,
    });

    await createProductionCost.execute({
      productionOrderId: 'order-2',
      costType: 'MATERIAL',
      plannedAmount: 500,
      actualAmount: 500,
    });

    const result = await sut.execute({
      productionOrderId: 'order-1',
    });

    expect(result.totalPlanned).toBe(1000);
    expect(result.details).toHaveLength(1);
  });
});

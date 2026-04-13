import { InMemoryProductionCostsRepository } from '@/repositories/production/in-memory/in-memory-production-costs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductionCostUseCase } from './create-production-cost';
import { UpdateProductionCostUseCase } from './update-production-cost';

let productionCostsRepository: InMemoryProductionCostsRepository;
let createProductionCost: CreateProductionCostUseCase;
let sut: UpdateProductionCostUseCase;

describe('UpdateProductionCostUseCase', () => {
  beforeEach(() => {
    productionCostsRepository = new InMemoryProductionCostsRepository();
    createProductionCost = new CreateProductionCostUseCase(
      productionCostsRepository,
    );
    sut = new UpdateProductionCostUseCase(productionCostsRepository);
  });

  it('should update a production cost', async () => {
    const { cost: created } = await createProductionCost.execute({
      productionOrderId: 'order-1',
      costType: 'MATERIAL',
      description: 'Raw materials',
      plannedAmount: 1000,
      actualAmount: 1200,
    });

    const { cost } = await sut.execute({
      id: created.id.toString(),
      actualAmount: 1100,
    });

    expect(cost.actualAmount).toBe(1100);
    expect(cost.varianceAmount).toBe(100); // 1100 - 1000
  });

  it('should update both planned and actual amounts', async () => {
    const { cost: created } = await createProductionCost.execute({
      productionOrderId: 'order-1',
      costType: 'LABOR',
      plannedAmount: 500,
      actualAmount: 500,
    });

    const { cost } = await sut.execute({
      id: created.id.toString(),
      plannedAmount: 600,
      actualAmount: 550,
    });

    expect(cost.plannedAmount).toBe(600);
    expect(cost.actualAmount).toBe(550);
    expect(cost.varianceAmount).toBe(-50);
  });

  it('should throw error if production cost does not exist', async () => {
    await expect(() =>
      sut.execute({
        id: 'non-existent-id',
        actualAmount: 100,
      }),
    ).rejects.toThrow('Production cost not found');
  });

  it('should update cost type', async () => {
    const { cost: created } = await createProductionCost.execute({
      productionOrderId: 'order-1',
      costType: 'MATERIAL',
      plannedAmount: 1000,
      actualAmount: 1000,
    });

    const { cost } = await sut.execute({
      id: created.id.toString(),
      costType: 'OVERHEAD',
    });

    expect(cost.costType).toBe('OVERHEAD');
  });

  it('should recalculate variance when only planned changes', async () => {
    const { cost: created } = await createProductionCost.execute({
      productionOrderId: 'order-1',
      costType: 'MATERIAL',
      plannedAmount: 1000,
      actualAmount: 1200,
    });

    const { cost } = await sut.execute({
      id: created.id.toString(),
      plannedAmount: 1100,
    });

    // variance = existing actual (1200) - new planned (1100) = 100
    expect(cost.varianceAmount).toBe(100);
  });
});

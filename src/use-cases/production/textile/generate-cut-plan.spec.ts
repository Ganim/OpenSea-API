import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateCutPlanUseCase } from './generate-cut-plan';
import { InMemoryProductionOrdersRepository } from '@/repositories/production/in-memory/in-memory-production-orders-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionOrder } from '@/entities/production/production-order';

let repository: InMemoryProductionOrdersRepository;
let useCase: GenerateCutPlanUseCase;
let orderId: string;

describe('GenerateCutPlanUseCase', () => {
  beforeEach(async () => {
    repository = new InMemoryProductionOrdersRepository();
    useCase = new GenerateCutPlanUseCase(repository);

    const order = await repository.create({
      tenantId: 'tenant-1',
      orderNumber: 'OP-0001',
      bomId: 'bom-1',
      productId: 'product-1',
      priority: 50,
      quantityPlanned: 1000,
      createdById: 'user-1',
    });

    orderId = order.id.toString();
  });

  it('should generate a cut plan from a size-color matrix', async () => {
    const { cutPlan } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      matrix: {
        sizes: ['P', 'M', 'G'],
        colors: ['Branco', 'Preto'],
        quantities: {
          P: { Branco: 50, Preto: 30 },
          M: { Branco: 100, Preto: 80 },
          G: { Branco: 60, Preto: 40 },
        },
      },
      baseFabricConsumptionPerPiece: 1.5,
      wastePercentage: 5,
    });

    expect(cutPlan.productionOrderId).toBe(orderId);
    expect(cutPlan.orderNumber).toBe('OP-0001');
    expect(cutPlan.totalPieces).toBe(360); // 50+30+100+80+60+40
    expect(cutPlan.piecesPerSize).toHaveLength(3);
    expect(cutPlan.piecesPerColor).toHaveLength(2);
    expect(cutPlan.wastePercentage).toBe(5);
    expect(cutPlan.totalWithWaste).toBeGreaterThan(cutPlan.totalEstimatedFabricMeters);
    expect(cutPlan.layersNeeded).toBeGreaterThan(0);
  });

  it('should calculate pieces per size correctly', async () => {
    const { cutPlan } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      matrix: {
        sizes: ['M', 'G'],
        colors: ['Azul'],
        quantities: {
          M: { Azul: 100 },
          G: { Azul: 50 },
        },
      },
      baseFabricConsumptionPerPiece: 2.0,
    });

    const sizeM = cutPlan.piecesPerSize.find((s) => s.size === 'M');
    const sizeG = cutPlan.piecesPerSize.find((s) => s.size === 'G');

    expect(sizeM?.totalPieces).toBe(100);
    expect(sizeG?.totalPieces).toBe(50);
    // G should consume more fabric per piece than M
    expect(sizeG!.estimatedFabricMeters / 50).toBeGreaterThan(
      sizeM!.estimatedFabricMeters / 100,
    );
  });

  it('should calculate pieces per color correctly', async () => {
    const { cutPlan } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      matrix: {
        sizes: ['M'],
        colors: ['Branco', 'Preto', 'Vermelho'],
        quantities: {
          M: { Branco: 100, Preto: 50, Vermelho: 25 },
        },
      },
      baseFabricConsumptionPerPiece: 1.0,
    });

    expect(cutPlan.piecesPerColor).toEqual([
      { color: 'Branco', totalPieces: 100 },
      { color: 'Preto', totalPieces: 50 },
      { color: 'Vermelho', totalPieces: 25 },
    ]);
  });

  it('should use custom size consumption factors when provided', async () => {
    const { cutPlan } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      matrix: {
        sizes: ['SMALL', 'LARGE'],
        colors: ['Red'],
        quantities: {
          SMALL: { Red: 100 },
          LARGE: { Red: 100 },
        },
      },
      baseFabricConsumptionPerPiece: 1.0,
      sizeConsumptionFactors: {
        SMALL: 0.8,
        LARGE: 1.5,
      },
    });

    const small = cutPlan.piecesPerSize.find((s) => s.size === 'SMALL');
    const large = cutPlan.piecesPerSize.find((s) => s.size === 'LARGE');

    expect(small?.estimatedFabricMeters).toBe(80); // 100 * 1.0 * 0.8
    expect(large?.estimatedFabricMeters).toBe(150); // 100 * 1.0 * 1.5
  });

  it('should calculate layers needed based on spreading table width', async () => {
    const { cutPlan } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      matrix: {
        sizes: ['M'],
        colors: ['Branco'],
        quantities: { M: { Branco: 120 } },
      },
      baseFabricConsumptionPerPiece: 1.0,
      spreadingTableWidthPieces: 50,
    });

    expect(cutPlan.layersNeeded).toBe(3); // ceil(120/50) = 3
  });

  it('should throw when production order does not exist', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        productionOrderId: 'nonexistent',
        matrix: {
          sizes: ['M'],
          colors: ['Branco'],
          quantities: { M: { Branco: 10 } },
        },
        baseFabricConsumptionPerPiece: 1.0,
      }),
    ).rejects.toThrow('Production order');
  });

  it('should throw when matrix has empty sizes', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        productionOrderId: orderId,
        matrix: {
          sizes: [],
          colors: ['Branco'],
          quantities: {},
        },
        baseFabricConsumptionPerPiece: 1.0,
      }),
    ).rejects.toThrow('at least one size and one color');
  });

  it('should throw when all quantities are zero', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        productionOrderId: orderId,
        matrix: {
          sizes: ['M'],
          colors: ['Branco'],
          quantities: { M: { Branco: 0 } },
        },
        baseFabricConsumptionPerPiece: 1.0,
      }),
    ).rejects.toThrow('at least one non-zero quantity');
  });

  it('should throw when a quantity is negative', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        productionOrderId: orderId,
        matrix: {
          sizes: ['M'],
          colors: ['Branco'],
          quantities: { M: { Branco: -5 } },
        },
        baseFabricConsumptionPerPiece: 1.0,
      }),
    ).rejects.toThrow('must be >= 0');
  });
});

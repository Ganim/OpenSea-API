import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateBundleTicketsUseCase } from './generate-bundle-tickets';
import { InMemoryProductionOrdersRepository } from '@/repositories/production/in-memory/in-memory-production-orders-repository';

let repository: InMemoryProductionOrdersRepository;
let useCase: GenerateBundleTicketsUseCase;
let orderId: string;

describe('GenerateBundleTicketsUseCase', () => {
  beforeEach(async () => {
    repository = new InMemoryProductionOrdersRepository();
    useCase = new GenerateBundleTicketsUseCase(repository);

    const order = await repository.create({
      tenantId: 'tenant-1',
      orderNumber: 'OP-0001',
      bomId: 'bom-1',
      productId: 'product-1',
      priority: 50,
      quantityPlanned: 500,
      createdById: 'user-1',
    });

    orderId = order.id.toString();
  });

  it('should generate bundle tickets for a size-color matrix', async () => {
    const { result } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      bundleSize: 10,
      sizes: ['M', 'G'],
      colors: ['Branco'],
      quantities: {
        M: { Branco: 25 },
        G: { Branco: 15 },
      },
    });

    expect(result.productionOrderId).toBe(orderId);
    expect(result.orderNumber).toBe('OP-0001');
    expect(result.bundleSize).toBe(10);
    expect(result.totalPieces).toBe(40);
    // M: 25 pieces / 10 = 3 bundles (10+10+5)
    // G: 15 pieces / 10 = 2 bundles (10+5)
    expect(result.totalBundles).toBe(5);
    expect(result.bundles).toHaveLength(5);
  });

  it('should assign sequential bundle numbers', async () => {
    const { result } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      bundleSize: 15,
      sizes: ['P', 'M'],
      colors: ['Azul'],
      quantities: {
        P: { Azul: 30 },
        M: { Azul: 15 },
      },
    });

    const numbers = result.bundles.map((b) => b.bundleNumber);
    expect(numbers).toEqual([1, 2, 3]);
  });

  it('should generate correct barcodes', async () => {
    const { result } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      bundleSize: 100,
      sizes: ['M'],
      colors: ['Branco'],
      quantities: { M: { Branco: 50 } },
    });

    expect(result.bundles[0].barcode).toBe('OPOP-0001-B0001');
  });

  it('should handle last bundle with fewer pieces', async () => {
    const { result } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      bundleSize: 10,
      sizes: ['M'],
      colors: ['Branco'],
      quantities: { M: { Branco: 23 } },
    });

    expect(result.bundles).toHaveLength(3);
    expect(result.bundles[0].quantity).toBe(10);
    expect(result.bundles[1].quantity).toBe(10);
    expect(result.bundles[2].quantity).toBe(3);
  });

  it('should use default bundle size of 15', async () => {
    const { result } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      sizes: ['M'],
      colors: ['Branco'],
      quantities: { M: { Branco: 30 } },
    });

    expect(result.bundleSize).toBe(15);
    expect(result.bundles).toHaveLength(2);
    expect(result.bundles[0].quantity).toBe(15);
    expect(result.bundles[1].quantity).toBe(15);
  });

  it('should generate bundles for multiple sizes and colors', async () => {
    const { result } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      bundleSize: 10,
      sizes: ['P', 'M'],
      colors: ['Branco', 'Preto'],
      quantities: {
        P: { Branco: 10, Preto: 10 },
        M: { Branco: 10, Preto: 10 },
      },
    });

    expect(result.totalPieces).toBe(40);
    expect(result.totalBundles).toBe(4);

    // Each size-color combination should produce exactly 1 bundle of 10
    expect(result.bundles[0]).toMatchObject({
      size: 'P',
      color: 'Branco',
      quantity: 10,
    });
    expect(result.bundles[1]).toMatchObject({
      size: 'P',
      color: 'Preto',
      quantity: 10,
    });
    expect(result.bundles[2]).toMatchObject({
      size: 'M',
      color: 'Branco',
      quantity: 10,
    });
    expect(result.bundles[3]).toMatchObject({
      size: 'M',
      color: 'Preto',
      quantity: 10,
    });
  });

  it('should throw when production order does not exist', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        productionOrderId: 'nonexistent',
        sizes: ['M'],
        colors: ['Branco'],
        quantities: { M: { Branco: 10 } },
      }),
    ).rejects.toThrow('Production order');
  });

  it('should throw when bundle size is out of range', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        productionOrderId: orderId,
        bundleSize: 0,
        sizes: ['M'],
        colors: ['Branco'],
        quantities: { M: { Branco: 10 } },
      }),
    ).rejects.toThrow('Bundle size must be between 1 and 100');
  });

  it('should throw when sizes array is empty', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        productionOrderId: orderId,
        sizes: [],
        colors: ['Branco'],
        quantities: {},
      }),
    ).rejects.toThrow('At least one size and one color');
  });

  it('should throw when all quantities are zero', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        productionOrderId: orderId,
        sizes: ['M'],
        colors: ['Branco'],
        quantities: { M: { Branco: 0 } },
      }),
    ).rejects.toThrow('at least one non-zero value');
  });

  it('should skip size-color combinations with zero quantity', async () => {
    const { result } = await useCase.execute({
      tenantId: 'tenant-1',
      productionOrderId: orderId,
      bundleSize: 10,
      sizes: ['P', 'M'],
      colors: ['Branco'],
      quantities: {
        P: { Branco: 0 },
        M: { Branco: 20 },
      },
    });

    expect(result.totalPieces).toBe(20);
    expect(result.totalBundles).toBe(2);
    // All bundles should be for size M
    expect(result.bundles.every((b) => b.size === 'M')).toBe(true);
  });
});

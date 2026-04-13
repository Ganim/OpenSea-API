import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProductionOrdersRepository } from '@/repositories/production/in-memory/in-memory-production-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductionOrderUseCase } from './create-production-order';
import { UpdateProductionOrderUseCase } from './update-production-order';

let productionOrdersRepository: InMemoryProductionOrdersRepository;
let createProductionOrder: CreateProductionOrderUseCase;
let sut: UpdateProductionOrderUseCase;

describe('Update Production Order Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    productionOrdersRepository = new InMemoryProductionOrdersRepository();
    createProductionOrder = new CreateProductionOrderUseCase(
      productionOrdersRepository,
    );
    sut = new UpdateProductionOrderUseCase(productionOrdersRepository);
  });

  // OBJECTIVE

  it('should update a DRAFT production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      priority: 3,
      quantityPlanned: 200,
      notes: 'Updated notes',
    });

    expect(updated.priority).toBe(3);
    expect(updated.quantityPlanned).toBe(200);
    expect(updated.notes).toBe('Updated notes');
  });

  it('should update a PLANNED production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    // Move to PLANNED
    const item = productionOrdersRepository.items[0];
    item.status = 'PLANNED';

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      priority: 5,
    });

    expect(updated.priority).toBe(5);
  });

  it('should update planned dates', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    const plannedStart = new Date('2026-06-01');
    const plannedEnd = new Date('2026-06-15');

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      plannedStartDate: plannedStart,
      plannedEndDate: plannedEnd,
    });

    expect(updated.plannedStartDate).toEqual(plannedStart);
    expect(updated.plannedEndDate).toEqual(plannedEnd);
  });

  it('should clear notes when set to null', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      notes: 'Initial notes',
      createdById: 'user-1',
    });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      notes: null,
    });

    expect(updated.notes).toBeNull();
  });

  // REJECTS

  it('should not update a FIRM production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    const item = productionOrdersRepository.items[0];
    item.status = 'FIRM';

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        priority: 3,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not update a RELEASED production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    const item = productionOrdersRepository.items[0];
    item.status = 'RELEASED';

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        priority: 3,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not update an IN_PROCESS production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    const item = productionOrdersRepository.items[0];
    item.status = 'IN_PROCESS';

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        priority: 3,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not update a CANCELLED production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    const item = productionOrdersRepository.items[0];
    item.status = 'CANCELLED';

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        priority: 3,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow quantity planned equal to zero', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        quantityPlanned: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError for non-existent order', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        priority: 3,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  // ISOLATION

  it('should not update an order from a different tenant', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: 'tenant-1',
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-2',
        id: productionOrder.id.toString(),
        priority: 3,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

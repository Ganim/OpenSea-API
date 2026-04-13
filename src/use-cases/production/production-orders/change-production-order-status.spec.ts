import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProductionOrdersRepository } from '@/repositories/production/in-memory/in-memory-production-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChangeProductionOrderStatusUseCase } from './change-production-order-status';
import { CreateProductionOrderUseCase } from './create-production-order';

let productionOrdersRepository: InMemoryProductionOrdersRepository;
let createProductionOrder: CreateProductionOrderUseCase;
let sut: ChangeProductionOrderStatusUseCase;

describe('Change Production Order Status Use Case', () => {
  const TENANT_ID = 'tenant-1';
  const USER_ID = 'user-1';

  beforeEach(() => {
    productionOrdersRepository = new InMemoryProductionOrdersRepository();
    createProductionOrder = new CreateProductionOrderUseCase(
      productionOrdersRepository,
    );
    sut = new ChangeProductionOrderStatusUseCase(productionOrdersRepository);
  });

  // --- VALID TRANSITIONS ---

  it('should transition DRAFT → PLANNED', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'PLANNED',
      userId: USER_ID,
    });

    expect(updated.status).toBe('PLANNED');
  });

  it('should transition PLANNED → FIRM', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'PLANNED',
      userId: USER_ID,
    });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'FIRM',
      userId: USER_ID,
    });

    expect(updated.status).toBe('FIRM');
  });

  it('should transition FIRM → RELEASED and set releasedAt/releasedById', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'PLANNED',
      userId: USER_ID,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'FIRM',
      userId: USER_ID,
    });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'RELEASED',
      userId: 'releaser-user',
    });

    expect(updated.status).toBe('RELEASED');
    expect(updated.releasedAt).toBeInstanceOf(Date);
    expect(updated.releasedById?.toString()).toBe('releaser-user');
  });

  it('should transition RELEASED → IN_PROCESS and set actualStartDate', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    // Progress through the lifecycle
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'PLANNED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'FIRM', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'RELEASED', userId: USER_ID });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'IN_PROCESS',
      userId: USER_ID,
    });

    expect(updated.status).toBe('IN_PROCESS');
    expect(updated.actualStartDate).toBeInstanceOf(Date);
  });

  it('should transition IN_PROCESS → TECHNICALLY_COMPLETE and set actualEndDate', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'PLANNED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'FIRM', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'RELEASED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'IN_PROCESS', userId: USER_ID });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'TECHNICALLY_COMPLETE',
      userId: USER_ID,
    });

    expect(updated.status).toBe('TECHNICALLY_COMPLETE');
    expect(updated.actualEndDate).toBeInstanceOf(Date);
  });

  it('should transition TECHNICALLY_COMPLETE → CLOSED', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'PLANNED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'FIRM', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'RELEASED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'IN_PROCESS', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'TECHNICALLY_COMPLETE', userId: USER_ID });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'CLOSED',
      userId: USER_ID,
    });

    expect(updated.status).toBe('CLOSED');
  });

  it('should complete full lifecycle: DRAFT → PLANNED → FIRM → RELEASED → IN_PROCESS → TECHNICALLY_COMPLETE → CLOSED', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    const statuses = ['PLANNED', 'FIRM', 'RELEASED', 'IN_PROCESS', 'TECHNICALLY_COMPLETE', 'CLOSED'] as const;
    let current = productionOrder;

    for (const targetStatus of statuses) {
      const result = await sut.execute({
        tenantId: TENANT_ID,
        id: current.id.toString(),
        targetStatus,
        userId: USER_ID,
      });
      current = result.productionOrder;
      expect(current.status).toBe(targetStatus);
    }
  });

  // --- CANCELLATION ---

  it('should cancel a DRAFT order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'CANCELLED',
      userId: USER_ID,
    });

    expect(updated.status).toBe('CANCELLED');
  });

  it('should cancel a PLANNED order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'PLANNED', userId: USER_ID });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'CANCELLED',
      userId: USER_ID,
    });

    expect(updated.status).toBe('CANCELLED');
  });

  it('should cancel a FIRM order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'PLANNED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'FIRM', userId: USER_ID });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'CANCELLED',
      userId: USER_ID,
    });

    expect(updated.status).toBe('CANCELLED');
  });

  it('should cancel a RELEASED order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'PLANNED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'FIRM', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'RELEASED', userId: USER_ID });

    const { productionOrder: updated } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'CANCELLED',
      userId: USER_ID,
    });

    expect(updated.status).toBe('CANCELLED');
  });

  // --- INVALID TRANSITIONS ---

  it('should not allow IN_PROCESS → CANCELLED', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'PLANNED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'FIRM', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'RELEASED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'IN_PROCESS', userId: USER_ID });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        targetStatus: 'CANCELLED',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow DRAFT → FIRM (must go through PLANNED)', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        targetStatus: 'FIRM',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow DRAFT → RELEASED', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        targetStatus: 'RELEASED',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow DRAFT → IN_PROCESS', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        targetStatus: 'IN_PROCESS',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow CLOSED → any status', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    // Progress to CLOSED
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'PLANNED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'FIRM', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'RELEASED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'IN_PROCESS', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'TECHNICALLY_COMPLETE', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'CLOSED', userId: USER_ID });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        targetStatus: 'DRAFT',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow CANCELLED → any status', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
      targetStatus: 'CANCELLED',
      userId: USER_ID,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        targetStatus: 'PLANNED',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow TECHNICALLY_COMPLETE → CANCELLED', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'PLANNED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'FIRM', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'RELEASED', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'IN_PROCESS', userId: USER_ID });
    await sut.execute({ tenantId: TENANT_ID, id: productionOrder.id.toString(), targetStatus: 'TECHNICALLY_COMPLETE', userId: USER_ID });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
        targetStatus: 'CANCELLED',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // REJECTS

  it('should throw ResourceNotFoundError for non-existent order', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        targetStatus: 'PLANNED',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  // ISOLATION

  it('should not change status of an order from a different tenant', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: 'tenant-1',
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: USER_ID,
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-2',
        id: productionOrder.id.toString(),
        targetStatus: 'PLANNED',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

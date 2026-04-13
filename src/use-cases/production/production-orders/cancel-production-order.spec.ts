import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProductionOrdersRepository } from '@/repositories/production/in-memory/in-memory-production-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelProductionOrderUseCase } from './cancel-production-order';
import { CreateProductionOrderUseCase } from './create-production-order';

let productionOrdersRepository: InMemoryProductionOrdersRepository;
let createProductionOrder: CreateProductionOrderUseCase;
let sut: CancelProductionOrderUseCase;

describe('Cancel Production Order Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    productionOrdersRepository = new InMemoryProductionOrdersRepository();
    createProductionOrder = new CreateProductionOrderUseCase(
      productionOrdersRepository,
    );
    sut = new CancelProductionOrderUseCase(productionOrdersRepository);
  });

  // OBJECTIVE

  it('should cancel a DRAFT production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    const { productionOrder: cancelled } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
    });

    expect(cancelled.status).toBe('CANCELLED');
  });

  it('should cancel a PLANNED production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    productionOrdersRepository.items[0].status = 'PLANNED';

    const { productionOrder: cancelled } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
    });

    expect(cancelled.status).toBe('CANCELLED');
  });

  it('should cancel a FIRM production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    productionOrdersRepository.items[0].status = 'FIRM';

    const { productionOrder: cancelled } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
    });

    expect(cancelled.status).toBe('CANCELLED');
  });

  it('should cancel a RELEASED production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    productionOrdersRepository.items[0].status = 'RELEASED';

    const { productionOrder: cancelled } = await sut.execute({
      tenantId: TENANT_ID,
      id: productionOrder.id.toString(),
    });

    expect(cancelled.status).toBe('CANCELLED');
  });

  // REJECTS

  it('should not cancel an IN_PROCESS production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    productionOrdersRepository.items[0].status = 'IN_PROCESS';

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not cancel a TECHNICALLY_COMPLETE production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    productionOrdersRepository.items[0].status = 'TECHNICALLY_COMPLETE';

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not cancel a CLOSED production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    productionOrdersRepository.items[0].status = 'CLOSED';

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not cancel an already CANCELLED production order', async () => {
    const { productionOrder } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    productionOrdersRepository.items[0].status = 'CANCELLED';

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: productionOrder.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError for non-existent order', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  // ISOLATION

  it('should not cancel an order from a different tenant', async () => {
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
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

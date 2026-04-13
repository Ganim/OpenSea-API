import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProductionOrdersRepository } from '@/repositories/production/in-memory/in-memory-production-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductionOrderUseCase } from './create-production-order';
import { GetProductionOrderByIdUseCase } from './get-production-order-by-id';

let productionOrdersRepository: InMemoryProductionOrdersRepository;
let createProductionOrder: CreateProductionOrderUseCase;
let sut: GetProductionOrderByIdUseCase;

describe('Get Production Order By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    productionOrdersRepository = new InMemoryProductionOrdersRepository();
    createProductionOrder = new CreateProductionOrderUseCase(
      productionOrdersRepository,
    );
    sut = new GetProductionOrderByIdUseCase(productionOrdersRepository);
  });

  // OBJECTIVE

  it('should get a production order by id', async () => {
    const { productionOrder: created } = await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    const { productionOrder } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
    });

    expect(productionOrder.id.toString()).toBe(created.id.toString());
    expect(productionOrder.quantityPlanned).toBe(100);
    expect(productionOrder.status).toBe('DRAFT');
  });

  // REJECTS

  it('should throw ResourceNotFoundError for non-existent order', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  // ISOLATION

  it('should not return an order from a different tenant', async () => {
    const { productionOrder: created } = await createProductionOrder.execute({
      tenantId: 'tenant-1',
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-2',
        id: created.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

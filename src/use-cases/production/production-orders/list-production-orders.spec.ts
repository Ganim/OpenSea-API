import { InMemoryProductionOrdersRepository } from '@/repositories/production/in-memory/in-memory-production-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductionOrderUseCase } from './create-production-order';
import { ListProductionOrdersUseCase } from './list-production-orders';

let productionOrdersRepository: InMemoryProductionOrdersRepository;
let createProductionOrder: CreateProductionOrderUseCase;
let sut: ListProductionOrdersUseCase;

describe('List Production Orders Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    productionOrdersRepository = new InMemoryProductionOrdersRepository();
    createProductionOrder = new CreateProductionOrderUseCase(
      productionOrdersRepository,
    );
    sut = new ListProductionOrdersUseCase(productionOrdersRepository);
  });

  // OBJECTIVE

  it('should list all production orders for a tenant', async () => {
    await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });
    await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-2',
      productId: 'product-2',
      quantityPlanned: 50,
      createdById: 'user-1',
    });

    const { productionOrders, meta } = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(productionOrders).toHaveLength(2);
    expect(meta.total).toBe(2);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(20);
    expect(meta.pages).toBe(1);
  });

  it('should return empty array when no orders exist', async () => {
    const { productionOrders, meta } = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(productionOrders).toEqual([]);
    expect(meta.total).toBe(0);
    expect(meta.pages).toBe(0);
  });

  it('should filter by status', async () => {
    await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });
    await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-2',
      productId: 'product-2',
      quantityPlanned: 50,
      createdById: 'user-1',
    });

    // Move second order to PLANNED
    productionOrdersRepository.items[1].status = 'PLANNED';

    const { productionOrders } = await sut.execute({
      tenantId: TENANT_ID,
      status: 'DRAFT',
    });

    expect(productionOrders).toHaveLength(1);
    expect(productionOrders[0].status).toBe('DRAFT');
  });

  it('should filter by search on orderNumber', async () => {
    await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });
    await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-2',
      productId: 'product-2',
      quantityPlanned: 50,
      createdById: 'user-1',
    });

    const year = new Date().getFullYear();
    const { productionOrders } = await sut.execute({
      tenantId: TENANT_ID,
      search: `OP-${year}-00001`,
    });

    expect(productionOrders).toHaveLength(1);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await createProductionOrder.execute({
        tenantId: TENANT_ID,
        bomId: `bom-${i}`,
        productId: `product-${i}`,
        quantityPlanned: 10 * (i + 1),
        createdById: 'user-1',
      });
    }

    const { productionOrders, meta } = await sut.execute({
      tenantId: TENANT_ID,
      page: 2,
      limit: 2,
    });

    expect(productionOrders).toHaveLength(2);
    expect(meta.total).toBe(5);
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(2);
    expect(meta.pages).toBe(3);
  });

  // ISOLATION

  it('should only list orders for the given tenant', async () => {
    await createProductionOrder.execute({
      tenantId: 'tenant-1',
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });
    await createProductionOrder.execute({
      tenantId: 'tenant-2',
      bomId: 'bom-2',
      productId: 'product-2',
      quantityPlanned: 50,
      createdById: 'user-2',
    });

    const { productionOrders } = await sut.execute({ tenantId: 'tenant-1' });

    expect(productionOrders).toHaveLength(1);
  });
});

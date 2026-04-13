import { InMemoryProductionOrdersRepository } from '@/repositories/production/in-memory/in-memory-production-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CountProductionOrdersByStatusUseCase } from './count-production-orders-by-status';
import { CreateProductionOrderUseCase } from './create-production-order';

let productionOrdersRepository: InMemoryProductionOrdersRepository;
let createProductionOrder: CreateProductionOrderUseCase;
let sut: CountProductionOrdersByStatusUseCase;

describe('Count Production Orders By Status Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    productionOrdersRepository = new InMemoryProductionOrdersRepository();
    createProductionOrder = new CreateProductionOrderUseCase(
      productionOrdersRepository,
    );
    sut = new CountProductionOrdersByStatusUseCase(productionOrdersRepository);
  });

  // OBJECTIVE

  it('should return empty counts when no orders exist', async () => {
    const { counts } = await sut.execute({ tenantId: TENANT_ID });

    expect(counts).toEqual({});
  });

  it('should count orders by status', async () => {
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
    await createProductionOrder.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-3',
      productId: 'product-3',
      quantityPlanned: 30,
      createdById: 'user-1',
    });

    // Move one to PLANNED
    productionOrdersRepository.items[1].status = 'PLANNED';

    const { counts } = await sut.execute({ tenantId: TENANT_ID });

    expect(counts).toEqual({
      DRAFT: 2,
      PLANNED: 1,
    });
  });

  it('should count multiple statuses correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await createProductionOrder.execute({
        tenantId: TENANT_ID,
        bomId: `bom-${i}`,
        productId: `product-${i}`,
        quantityPlanned: 10,
        createdById: 'user-1',
      });
    }

    productionOrdersRepository.items[0].status = 'PLANNED';
    productionOrdersRepository.items[1].status = 'PLANNED';
    productionOrdersRepository.items[2].status = 'FIRM';
    productionOrdersRepository.items[3].status = 'IN_PROCESS';

    const { counts } = await sut.execute({ tenantId: TENANT_ID });

    expect(counts).toEqual({
      DRAFT: 1,
      PLANNED: 2,
      FIRM: 1,
      IN_PROCESS: 1,
    });
  });

  // ISOLATION

  it('should only count orders for the given tenant', async () => {
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

    const { counts } = await sut.execute({ tenantId: 'tenant-1' });

    expect(counts).toEqual({ DRAFT: 1 });
  });
});

import { InMemoryProductionOrdersRepository } from '@/repositories/production/in-memory/in-memory-production-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetProductionDashboardUseCase } from './get-production-dashboard';

let productionOrdersRepository: InMemoryProductionOrdersRepository;
let sut: GetProductionDashboardUseCase;

describe('GetProductionDashboardUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    productionOrdersRepository = new InMemoryProductionOrdersRepository();
    sut = new GetProductionDashboardUseCase(productionOrdersRepository);
  });

  it('should return empty counts when no orders exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalOrders).toBe(0);
    expect(result.activeOrders).toBe(0);
    expect(result.orderCounts).toEqual({});
  });

  it('should count orders by status', async () => {
    await productionOrdersRepository.create({
      tenantId: TENANT_ID,
      orderNumber: 'OP-001',
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      priority: 1,
      status: 'PLANNED',
      createdById: 'user-1',
    });

    await productionOrdersRepository.create({
      tenantId: TENANT_ID,
      orderNumber: 'OP-002',
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 50,
      priority: 2,
      status: 'IN_PROCESS',
      createdById: 'user-1',
    });

    await productionOrdersRepository.create({
      tenantId: TENANT_ID,
      orderNumber: 'OP-003',
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 75,
      priority: 3,
      status: 'COMPLETED',
      createdById: 'user-1',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalOrders).toBe(3);
    expect(result.activeOrders).toBe(2); // PLANNED + IN_PROCESS
    expect(result.orderCounts['PLANNED']).toBe(1);
    expect(result.orderCounts['IN_PROCESS']).toBe(1);
    expect(result.orderCounts['COMPLETED']).toBe(1);
  });

  it('should count active statuses correctly', async () => {
    const activeStatuses = ['PLANNED', 'FIRM', 'RELEASED', 'IN_PROCESS'];

    for (let i = 0; i < activeStatuses.length; i++) {
      await productionOrdersRepository.create({
        tenantId: TENANT_ID,
        orderNumber: `OP-${i}`,
        bomId: 'bom-1',
        productId: 'product-1',
        quantityPlanned: 10,
        priority: 1,
        status: activeStatuses[i] as any,
        createdById: 'user-1',
      });
    }

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalOrders).toBe(4);
    expect(result.activeOrders).toBe(4);
  });

  it('should not count other tenant orders', async () => {
    await productionOrdersRepository.create({
      tenantId: 'tenant-2',
      orderNumber: 'OP-001',
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      priority: 1,
      status: 'PLANNED',
      createdById: 'user-1',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalOrders).toBe(0);
    expect(result.activeOrders).toBe(0);
  });
});

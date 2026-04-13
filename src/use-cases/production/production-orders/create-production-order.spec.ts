import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryProductionOrdersRepository } from '@/repositories/production/in-memory/in-memory-production-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductionOrderUseCase } from './create-production-order';

let productionOrdersRepository: InMemoryProductionOrdersRepository;
let sut: CreateProductionOrderUseCase;

describe('Create Production Order Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    productionOrdersRepository = new InMemoryProductionOrdersRepository();
    sut = new CreateProductionOrderUseCase(productionOrdersRepository);
  });

  // OBJECTIVE

  it('should create a production order with DRAFT status', async () => {
    const { productionOrder } = await sut.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    expect(productionOrder.id.toString()).toEqual(expect.any(String));
    expect(productionOrder.status).toBe('DRAFT');
    expect(productionOrder.quantityPlanned).toBe(100);
    expect(productionOrder.priority).toBe(0);
  });

  it('should auto-generate an order number', async () => {
    const { productionOrder } = await sut.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 50,
      createdById: 'user-1',
    });

    const year = new Date().getFullYear();
    expect(productionOrder.orderNumber).toBe(`OP-${year}-00001`);
  });

  it('should increment order number sequentially', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 50,
      createdById: 'user-1',
    });

    const { productionOrder } = await sut.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-2',
      productId: 'product-2',
      quantityPlanned: 30,
      createdById: 'user-1',
    });

    const year = new Date().getFullYear();
    expect(productionOrder.orderNumber).toBe(`OP-${year}-00002`);
  });

  it('should create a production order with all optional fields', async () => {
    const plannedStart = new Date('2026-05-01');
    const plannedEnd = new Date('2026-05-15');

    const { productionOrder } = await sut.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 200,
      priority: 5,
      salesOrderId: 'sales-order-1',
      parentOrderId: 'parent-order-1',
      plannedStartDate: plannedStart,
      plannedEndDate: plannedEnd,
      notes: 'Urgent production batch',
      createdById: 'user-1',
    });

    expect(productionOrder.priority).toBe(5);
    expect(productionOrder.salesOrderId?.toString()).toBe('sales-order-1');
    expect(productionOrder.parentOrderId?.toString()).toBe('parent-order-1');
    expect(productionOrder.plannedStartDate).toEqual(plannedStart);
    expect(productionOrder.plannedEndDate).toEqual(plannedEnd);
    expect(productionOrder.notes).toBe('Urgent production batch');
  });

  it('should initialize quantity fields to zero', async () => {
    const { productionOrder } = await sut.execute({
      tenantId: TENANT_ID,
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 100,
      createdById: 'user-1',
    });

    expect(productionOrder.quantityStarted).toBe(0);
    expect(productionOrder.quantityCompleted).toBe(0);
    expect(productionOrder.quantityScrapped).toBe(0);
  });

  // REJECTS

  it('should not allow quantity planned equal to zero', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        bomId: 'bom-1',
        productId: 'product-1',
        quantityPlanned: 0,
        createdById: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow negative quantity planned', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        bomId: 'bom-1',
        productId: 'product-1',
        quantityPlanned: -10,
        createdById: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // ISOLATION

  it('should generate independent order numbers per tenant', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 50,
      createdById: 'user-1',
    });

    const { productionOrder } = await sut.execute({
      tenantId: 'tenant-2',
      bomId: 'bom-1',
      productId: 'product-1',
      quantityPlanned: 50,
      createdById: 'user-2',
    });

    const year = new Date().getFullYear();
    expect(productionOrder.orderNumber).toBe(`OP-${year}-00001`);
  });
});

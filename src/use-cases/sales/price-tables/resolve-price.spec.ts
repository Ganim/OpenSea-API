import { InMemoryPriceTablesRepository } from '@/repositories/sales/in-memory/in-memory-price-tables-repository';
import { InMemoryPriceTableItemsRepository } from '@/repositories/sales/in-memory/in-memory-price-table-items-repository';
import { InMemoryCustomerPricesRepository } from '@/repositories/sales/in-memory/in-memory-customer-prices-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResolvePriceUseCase } from './resolve-price';

let priceTablesRepository: InMemoryPriceTablesRepository;
let priceTableItemsRepository: InMemoryPriceTableItemsRepository;
let customerPricesRepository: InMemoryCustomerPricesRepository;
let sut: ResolvePriceUseCase;

describe('ResolvePriceUseCase', () => {
  beforeEach(() => {
    priceTablesRepository = new InMemoryPriceTablesRepository();
    priceTableItemsRepository = new InMemoryPriceTableItemsRepository();
    customerPricesRepository = new InMemoryCustomerPricesRepository();
    sut = new ResolvePriceUseCase(
      priceTablesRepository,
      priceTableItemsRepository,
      customerPricesRepository,
    );
  });

  it('should resolve price from customer-specific pricing (highest priority)', async () => {
    await customerPricesRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      variantId: 'variant-1',
      price: 89.9,
      createdByUserId: 'user-1',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: 'variant-1',
      customerId: 'customer-1',
    });

    expect(result.price).toBe(89.9);
    expect(result.source).toBe('customer_price');
    expect(result.tiered).toBe(false);
  });

  it('should resolve price from price table when no customer price', async () => {
    const priceTable = await priceTablesRepository.create({
      tenantId: 'tenant-1',
      name: 'Default Prices',
      type: 'STANDARD',
      currency: 'BRL',
      isActive: true,
      priority: 1,
    });

    await priceTableItemsRepository.create({
      priceTableId: priceTable.id.toString(),
      tenantId: 'tenant-1',
      variantId: 'variant-1',
      price: 99.9,
      minQuantity: 1,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: 'variant-1',
    });

    expect(result.price).toBe(99.9);
    expect(result.source).toBe('price_table');
    expect(result.priceTableName).toBe('Default Prices');
  });

  it('should throw when no price is found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        variantId: 'non-existent',
      }),
    ).rejects.toThrow('Variant not found');
  });

  it('should resolve tiered pricing based on quantity', async () => {
    const priceTable = await priceTablesRepository.create({
      tenantId: 'tenant-1',
      name: 'Tiered Prices',
      type: 'STANDARD',
      currency: 'BRL',
      isActive: true,
      priority: 1,
    });

    await priceTableItemsRepository.create({
      priceTableId: priceTable.id.toString(),
      tenantId: 'tenant-1',
      variantId: 'variant-1',
      price: 100,
      minQuantity: 1,
    });

    await priceTableItemsRepository.create({
      priceTableId: priceTable.id.toString(),
      tenantId: 'tenant-1',
      variantId: 'variant-1',
      price: 80,
      minQuantity: 10,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: 'variant-1',
      quantity: 15,
    });

    expect(result.price).toBe(80);
    expect(result.tiered).toBe(true);
  });

  it('should prioritize customer price over price table', async () => {
    await customerPricesRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      variantId: 'variant-1',
      price: 75,
      createdByUserId: 'user-1',
    });

    const priceTable = await priceTablesRepository.create({
      tenantId: 'tenant-1',
      name: 'Default',
      type: 'STANDARD',
      currency: 'BRL',
      isActive: true,
      priority: 1,
    });

    await priceTableItemsRepository.create({
      priceTableId: priceTable.id.toString(),
      tenantId: 'tenant-1',
      variantId: 'variant-1',
      price: 100,
      minQuantity: 1,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: 'variant-1',
      customerId: 'customer-1',
    });

    expect(result.price).toBe(75);
    expect(result.source).toBe('customer_price');
  });

  it('should filter by specific priceTableId when provided', async () => {
    const table1 = await priceTablesRepository.create({
      tenantId: 'tenant-1',
      name: 'Table 1',
      type: 'STANDARD',
      currency: 'BRL',
      isActive: true,
      priority: 1,
    });

    const table2 = await priceTablesRepository.create({
      tenantId: 'tenant-1',
      name: 'Table 2',
      type: 'PROMOTIONAL',
      currency: 'BRL',
      isActive: true,
      priority: 2,
    });

    await priceTableItemsRepository.create({
      priceTableId: table1.id.toString(),
      tenantId: 'tenant-1',
      variantId: 'variant-1',
      price: 100,
      minQuantity: 1,
    });

    await priceTableItemsRepository.create({
      priceTableId: table2.id.toString(),
      tenantId: 'tenant-1',
      variantId: 'variant-1',
      price: 70,
      minQuantity: 1,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: 'variant-1',
      priceTableId: table1.id.toString(),
    });

    expect(result.price).toBe(100);
    expect(result.priceTableId).toBe(table1.id.toString());
  });
});

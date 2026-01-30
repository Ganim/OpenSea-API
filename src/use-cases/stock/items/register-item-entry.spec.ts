import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryItemMovementsRepository } from '@/repositories/stock/in-memory/in-memory-item-movements-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductUseCase } from '../products/create-product';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateVariantUseCase } from '../variants/create-variant';
import { RegisterItemEntryUseCase } from './register-item-entry';

let itemsRepository: InMemoryItemsRepository;
let variantsRepository: InMemoryVariantsRepository;
let binsRepository: InMemoryBinsRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let zonesRepository: InMemoryZonesRepository;
let itemMovementsRepository: InMemoryItemMovementsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let registerItemEntry: RegisterItemEntryUseCase;
let createVariant: CreateVariantUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

async function createTestBin(
  warehousesRepo: InMemoryWarehousesRepository,
  zonesRepo: InMemoryZonesRepository,
  binsRepo: InMemoryBinsRepository,
  code: string,
) {
  let warehouse = await warehousesRepo.findByCode('FAB');
  if (!warehouse) {
    warehouse = await warehousesRepo.create({
      code: 'FAB',
      name: 'Fábrica Principal',
    });
  }

  let zone = await zonesRepo.findByCode(warehouse.warehouseId, 'EST');
  if (!zone) {
    zone = await zonesRepo.create({
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });
  }

  const bin = await binsRepo.create({
    zoneId: zone.zoneId,
    address: `FAB-EST-${code}`,
    aisle: 1,
    shelf: 1,
    position: code,
  });

  return { warehouse, zone, bin };
}

describe('RegisterItemEntryUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    variantsRepository = new InMemoryVariantsRepository();
    binsRepository = new InMemoryBinsRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    zonesRepository = new InMemoryZonesRepository();
    itemMovementsRepository = new InMemoryItemMovementsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();

    registerItemEntry = new RegisterItemEntryUseCase(
      itemsRepository,
      variantsRepository,
      binsRepository,
      itemMovementsRepository,
      productsRepository,
      templatesRepository,
    );

    createVariant = new CreateVariantUseCase(
      variantsRepository,
      productsRepository,
      templatesRepository,
    );

    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
    );

    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should be able to register an item entry', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    const userId = new UniqueEntityID().toString();

    const result = await registerItemEntry.execute({
      uniqueCode: 'ITEM-001',
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
      quantity: 100,
      userId,
    });

    expect(result.item).toBeDefined();
    expect(result.item.uniqueCode).toBe('ITEM-001');
    expect(result.item.initialQuantity).toBe(100);
    expect(result.item.currentQuantity).toBe(100);
    expect(result.item.status).toBe('AVAILABLE');
    expect(result.movement).toBeDefined();
    expect(result.movement.quantity).toBe(100);
    expect(result.movement.movementType).toBe('INVENTORY_ADJUSTMENT');
  });

  it('should be able to register item entry with batch and dates', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    const userId = new UniqueEntityID().toString();
    const manufacturingDate = new Date('2024-01-01');
    const expiryDate = new Date('2027-12-31');

    const result = await registerItemEntry.execute({
      uniqueCode: 'ITEM-002',
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
      quantity: 50,
      userId,
      batchNumber: 'BATCH-001',
      manufacturingDate,
      expiryDate,
      notes: 'Test entry with batch',
    });

    expect(result.item.batchNumber).toBe('BATCH-001');
    expect(result.item.manufacturingDate).toEqual(manufacturingDate);
    expect(result.item.expiryDate).toEqual(expiryDate);
  });

  it('should auto-generate unique code when not provided', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product Auto Code',
      code: 'P-AUT',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-A',
      name: 'Test Variant Auto',
      price: 100,
    });

    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    const userId = new UniqueEntityID().toString();

    const result = await registerItemEntry.execute({
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
      quantity: 100,
      userId,
    });

    expect(result.item).toBeDefined();
    expect(result.item.uniqueCode).toBeDefined();
    expect(result.item.uniqueCode!.length).toBeGreaterThan(0);
  });

  it('should not allow unique code exceeding 128 characters', async () => {
    await expect(() =>
      registerItemEntry.execute({
        uniqueCode: 'A'.repeat(129),
        variantId: new UniqueEntityID().toString(),
        binId: new UniqueEntityID().toString(),
        quantity: 100,
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate unique code', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    const userId = new UniqueEntityID().toString();

    await registerItemEntry.execute({
      uniqueCode: 'ITEM-DUPLICATE',
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
      quantity: 100,
      userId,
    });

    await expect(() =>
      registerItemEntry.execute({
        uniqueCode: 'ITEM-DUPLICATE',
        variantId: variant.id.toString(),
        binId: bin.binId.toString(),
        quantity: 50,
        userId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow negative or zero quantity', async () => {
    await expect(() =>
      registerItemEntry.execute({
        uniqueCode: 'ITEM-003',
        variantId: new UniqueEntityID().toString(),
        binId: new UniqueEntityID().toString(),
        quantity: 0,
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(() =>
      registerItemEntry.execute({
        uniqueCode: 'ITEM-004',
        variantId: new UniqueEntityID().toString(),
        binId: new UniqueEntityID().toString(),
        quantity: -10,
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow non-existent variant', async () => {
    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    await expect(() =>
      registerItemEntry.execute({
        uniqueCode: 'ITEM-005',
        variantId: new UniqueEntityID().toString(),
        binId: bin.binId.toString(),
        quantity: 100,
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow non-existent bin', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    await expect(() =>
      registerItemEntry.execute({
        uniqueCode: 'ITEM-006',
        variantId: variant.id.toString(),
        binId: new UniqueEntityID().toString(),
        quantity: 100,
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow manufacturing date after expiry date', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    await expect(() =>
      registerItemEntry.execute({
        uniqueCode: 'ITEM-007',
        variantId: variant.id.toString(),
        binId: bin.binId.toString(),
        quantity: 100,
        userId: new UniqueEntityID().toString(),
        manufacturingDate: new Date('2025-12-31'),
        expiryDate: new Date('2024-01-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow expiry date in the past', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    await expect(() =>
      registerItemEntry.execute({
        uniqueCode: 'ITEM-008',
        variantId: variant.id.toString(),
        binId: bin.binId.toString(),
        quantity: 100,
        userId: new UniqueEntityID().toString(),
        expiryDate: new Date('2020-01-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should persist unitCost when provided', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    const userId = new UniqueEntityID().toString();

    const result = await registerItemEntry.execute({
      uniqueCode: 'ITEM-COST-001',
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
      quantity: 50,
      unitCost: 29.99,
      userId,
    });

    expect(result.item.unitCost).toBe(29.99);
    expect(result.item.totalCost).toBe(29.99 * 50);

    // Verify persistence in repository
    const persistedItem = itemsRepository.items[0];
    expect(persistedItem.unitCost).toBe(29.99);
  });

  it('should work without unitCost (optional field)', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    const userId = new UniqueEntityID().toString();

    const result = await registerItemEntry.execute({
      uniqueCode: 'ITEM-NO-COST',
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
      quantity: 25,
      userId,
    });

    expect(result.item.unitCost).toBeUndefined();
    expect(result.item.totalCost).toBeUndefined();
  });

  it('should not allow invalid item attributes not in template', async () => {
    const { template } = await createTemplate.execute({
      name: 'Electronics Template',
      productAttributes: { brand: templateAttr.string() },
      itemAttributes: { serialNumber: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Smartphone',
      code: 'PHONE-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'PHONE-001-BLK',
      name: 'Smartphone Black',
      price: 999.99,
    });

    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    await expect(() =>
      registerItemEntry.execute({
        uniqueCode: 'ITEM-009',
        variantId: variant.id.toString(),
        binId: bin.binId.toString(),
        quantity: 1,
        userId: new UniqueEntityID().toString(),
        attributes: { serialNumber: 'SN123', invalidKey: 'InvalidValue' },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});

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
import { TransferItemUseCase } from './transfer-item';

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
let transferItem: TransferItemUseCase;
let createVariant: CreateVariantUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

async function createTestBin(
  warehousesRepo: InMemoryWarehousesRepository,
  zonesRepo: InMemoryZonesRepository,
  binsRepo: InMemoryBinsRepository,
  code: string,
) {
  // Create warehouse if needed
  let warehouse = await warehousesRepo.findByCode('FAB');
  if (!warehouse) {
    warehouse = await warehousesRepo.create({
      code: 'FAB',
      name: 'Fábrica Principal',
    });
  }

  // Create zone if needed
  let zone = await zonesRepo.findByCode(warehouse.warehouseId, 'EST');
  if (!zone) {
    zone = await zonesRepo.create({
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });
  }

  // Create bin
  const bin = await binsRepo.create({
    zoneId: zone.zoneId,
    address: `FAB-EST-${code}`,
    aisle: 1,
    shelf: 1,
    position: code,
  });

  return { warehouse, zone, bin };
}

describe('TransferItemUseCase', () => {
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

    transferItem = new TransferItemUseCase(
      itemsRepository,
      binsRepository,
      itemMovementsRepository,
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

  it('should be able to transfer an item to a different bin', async () => {
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

    const { bin: binA } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    const { bin: binB } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'B',
    );

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-001',
      variantId: variant.id.toString(),
      binId: binA.binId.toString(),
      quantity: 100,
      userId,
    });

    const result = await transferItem.execute({
      itemId: entryItem.id,
      destinationBinId: binB.binId.toString(),
      userId,
      reasonCode: 'Relocation',
    });

    expect(result.item).toBeDefined();
    expect(result.item.binId).toBe(binB.binId.toString());
    expect(result.item.currentQuantity).toBe(100);
    expect(result.movement).toBeDefined();
    expect(result.movement.movementType).toBe('TRANSFER');
    expect(result.movement.quantity).toBe(100);
  });

  it('should not allow transfer to same bin', async () => {
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

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-002',
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
      quantity: 50,
      userId,
    });

    await expect(() =>
      transferItem.execute({
        itemId: entryItem.id,
        destinationBinId: bin.binId.toString(),
        userId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow transfer for non-existent item', async () => {
    const { bin } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    await expect(() =>
      transferItem.execute({
        itemId: new UniqueEntityID().toString(),
        destinationBinId: bin.binId.toString(),
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow transfer to non-existent bin', async () => {
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

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-003',
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
      quantity: 30,
      userId,
    });

    await expect(() =>
      transferItem.execute({
        itemId: entryItem.id,
        destinationBinId: new UniqueEntityID().toString(),
        userId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should create movement record with destination reference', async () => {
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

    const { bin: binA } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    const { bin: binB } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'B',
    );

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-004',
      variantId: variant.id.toString(),
      binId: binA.binId.toString(),
      quantity: 25,
      userId,
    });

    const result = await transferItem.execute({
      itemId: entryItem.id,
      destinationBinId: binB.binId.toString(),
      userId,
      reasonCode: 'Stock replenishment',
      notes: 'Transferred for display',
    });

    expect(result.movement.destinationRef).toContain(binB.address);
    expect(result.movement.reasonCode).toBe('Stock replenishment');
    expect(result.movement.notes).toBe('Transferred for display');
  });

  it('should handle multiple transfers for same item', async () => {
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

    const { bin: binA } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    const { bin: binB } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'B',
    );

    const { bin: binC } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'C',
    );

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-005',
      variantId: variant.id.toString(),
      binId: binA.binId.toString(),
      quantity: 100,
      userId,
    });

    // First transfer: A -> B
    await transferItem.execute({
      itemId: entryItem.id,
      destinationBinId: binB.binId.toString(),
      userId,
    });

    // Second transfer: B -> C
    const finalResult = await transferItem.execute({
      itemId: entryItem.id,
      destinationBinId: binC.binId.toString(),
      userId,
    });

    expect(finalResult.item.binId).toBe(binC.binId.toString());
    expect(finalResult.item.currentQuantity).toBe(100);
  });
});

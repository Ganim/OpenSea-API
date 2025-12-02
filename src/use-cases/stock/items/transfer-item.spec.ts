import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryItemMovementsRepository } from '@/repositories/stock/in-memory/in-memory-item-movements-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryLocationsRepository } from '@/repositories/stock/in-memory/in-memory-locations-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLocationUseCase } from '../locations/create-location';
import { CreateProductUseCase } from '../products/create-product';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateVariantUseCase } from '../variants/create-variant';
import { RegisterItemEntryUseCase } from './register-item-entry';
import { TransferItemUseCase } from './transfer-item';

let itemsRepository: InMemoryItemsRepository;
let variantsRepository: InMemoryVariantsRepository;
let locationsRepository: InMemoryLocationsRepository;
let itemMovementsRepository: InMemoryItemMovementsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let registerItemEntry: RegisterItemEntryUseCase;
let transferItem: TransferItemUseCase;
let createVariant: CreateVariantUseCase;
let createLocation: CreateLocationUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

describe('TransferItemUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    variantsRepository = new InMemoryVariantsRepository();
    locationsRepository = new InMemoryLocationsRepository();
    itemMovementsRepository = new InMemoryItemMovementsRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    registerItemEntry = new RegisterItemEntryUseCase(
      itemsRepository,
      variantsRepository,
      locationsRepository,
      itemMovementsRepository,
      productsRepository,
      templatesRepository,
    );
    transferItem = new TransferItemUseCase(
      itemsRepository,
      locationsRepository,
      itemMovementsRepository,
    );
    createVariant = new CreateVariantUseCase(
      variantsRepository,
      productsRepository,
      templatesRepository,
    );
    createLocation = new CreateLocationUseCase(locationsRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
    );
    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should be able to transfer an item to a different location', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      unitOfMeasure: 'UNITS',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { location: locationA } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    const { location: locationB } = await createLocation.execute({
      code: 'WH-B',
      titulo: 'Warehouse B',
      type: 'WAREHOUSE',
    });

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-001',
      variantId: variant.id.toString(),
      locationId: locationA.id.toString(),
      quantity: 100,
      userId,
    });

    const result = await transferItem.execute({
      itemId: entryItem.id,
      destinationLocationId: locationB.id.toString(),
      userId,
      reasonCode: 'Relocation',
    });

    expect(result.item).toBeDefined();
    expect(result.item.locationId).toBe(locationB.id.toString());
    expect(result.item.currentQuantity).toBe(100); // Quantity unchanged
    expect(result.movement).toBeDefined();
    expect(result.movement.movementType).toBe('TRANSFER');
    expect(result.movement.quantity).toBe(100);
  });

  it('should not allow transfer to same location', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      unitOfMeasure: 'UNITS',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { location } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-002',
      variantId: variant.id.toString(),
      locationId: location.id.toString(),
      quantity: 50,
      userId,
    });

    await expect(() =>
      transferItem.execute({
        itemId: entryItem.id,
        destinationLocationId: location.id.toString(),
        userId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow transfer for non-existent item', async () => {
    const { location } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    await expect(() =>
      transferItem.execute({
        itemId: new UniqueEntityID().toString(),
        destinationLocationId: location.id.toString(),
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow transfer to non-existent location', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      unitOfMeasure: 'UNITS',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { location } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-003',
      variantId: variant.id.toString(),
      locationId: location.id.toString(),
      quantity: 30,
      userId,
    });

    await expect(() =>
      transferItem.execute({
        itemId: entryItem.id,
        destinationLocationId: new UniqueEntityID().toString(),
        userId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should create movement record with destination reference', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      unitOfMeasure: 'UNITS',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { location: locationA } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    const { location: locationB } = await createLocation.execute({
      code: 'STR01',
      titulo: 'Retail Store 1',
      type: 'OTHER',
    });

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-004',
      variantId: variant.id.toString(),
      locationId: locationA.id.toString(),
      quantity: 25,
      userId,
    });

    const result = await transferItem.execute({
      itemId: entryItem.id,
      destinationLocationId: locationB.id.toString(),
      userId,
      reasonCode: 'Stock replenishment',
      notes: 'Transferred for display',
    });

    expect(result.movement.destinationRef).toContain(locationB.code);
    expect(result.movement.reasonCode).toBe('Stock replenishment');
    expect(result.movement.notes).toBe('Transferred for display');
  });

  it('should handle multiple transfers for same item', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      unitOfMeasure: 'UNITS',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      productId: product.id.toString(),
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { location: locationA } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    const { location: locationB } = await createLocation.execute({
      code: 'WH-B',
      titulo: 'Warehouse B',
      type: 'WAREHOUSE',
    });

    const { location: locationC } = await createLocation.execute({
      code: 'STR01',
      titulo: 'Store 1',
      type: 'OTHER',
    });

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-005',
      variantId: variant.id.toString(),
      locationId: locationA.id.toString(),
      quantity: 100,
      userId,
    });

    // First transfer: A -> B
    await transferItem.execute({
      itemId: entryItem.id,
      destinationLocationId: locationB.id.toString(),
      userId,
    });

    // Second transfer: B -> C
    const finalResult = await transferItem.execute({
      itemId: entryItem.id,
      destinationLocationId: locationC.id.toString(),
      userId,
    });

    expect(finalResult.item.locationId).toBe(locationC.id.toString());
    expect(finalResult.item.currentQuantity).toBe(100); // Quantity unchanged
  });
});

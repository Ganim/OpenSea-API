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
import { RegisterItemExitUseCase } from './register-item-exit';

let itemsRepository: InMemoryItemsRepository;
let variantsRepository: InMemoryVariantsRepository;
let locationsRepository: InMemoryLocationsRepository;
let itemMovementsRepository: InMemoryItemMovementsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let registerItemEntry: RegisterItemEntryUseCase;
let registerItemExit: RegisterItemExitUseCase;
let createVariant: CreateVariantUseCase;
let createLocation: CreateLocationUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

describe('RegisterItemExitUseCase', () => {
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
    registerItemExit = new RegisterItemExitUseCase(
      itemsRepository,
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

  it('should be able to register an item exit for sale', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
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

    const { location } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    const userId = new UniqueEntityID().toString();

    // First register an entry
    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-001',
      variantId: variant.id.toString(),
      locationId: location.id.toString(),
      quantity: 100,
      userId,
    });

    // Then register an exit
    const result = await registerItemExit.execute({
      itemId: entryItem.id,
      quantity: 30,
      userId,
      movementType: 'SALE',
      reasonCode: 'Customer order #123',
      destinationRef: 'ORDER-123',
    });

    expect(result.item).toBeDefined();
    expect(result.item.currentQuantity).toBe(70);
    expect(result.item.initialQuantity).toBe(100);
    expect(result.movement).toBeDefined();
    expect(result.movement.quantity).toBe(30);
    expect(result.movement.movementType).toBe('SALE');
    expect(result.movement.quantityBefore).toBe(100);
    expect(result.movement.quantityAfter).toBe(70);
  });

  it('should be able to register item exit for loss', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
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

    const result = await registerItemExit.execute({
      itemId: entryItem.id,
      quantity: 5,
      userId,
      movementType: 'LOSS',
      reasonCode: 'Damaged during inspection',
    });

    expect(result.item.currentQuantity).toBe(45);
    expect(result.movement.movementType).toBe('LOSS');
  });

  it('should not allow negative or zero quantity', async () => {
    await expect(() =>
      registerItemExit.execute({
        itemId: new UniqueEntityID().toString(),
        quantity: 0,
        userId: new UniqueEntityID().toString(),
        movementType: 'SALE',
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(() =>
      registerItemExit.execute({
        itemId: new UniqueEntityID().toString(),
        quantity: -10,
        userId: new UniqueEntityID().toString(),
        movementType: 'SALE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow exit for non-existent item', async () => {
    await expect(() =>
      registerItemExit.execute({
        itemId: new UniqueEntityID().toString(),
        quantity: 10,
        userId: new UniqueEntityID().toString(),
        movementType: 'SALE',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow exit with insufficient quantity', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
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
      quantity: 10,
      userId,
    });

    await expect(() =>
      registerItemExit.execute({
        itemId: entryItem.id,
        quantity: 15,
        userId,
        movementType: 'SALE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow exit with exact available quantity', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
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

    const { location } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-004',
      variantId: variant.id.toString(),
      locationId: location.id.toString(),
      quantity: 20,
      userId,
    });

    const result = await registerItemExit.execute({
      itemId: entryItem.id,
      quantity: 20,
      userId,
      movementType: 'SALE',
    });

    expect(result.item.currentQuantity).toBe(0);
  });

  it('should be able to register exit for production', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
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

    const { location } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-005',
      variantId: variant.id.toString(),
      locationId: location.id.toString(),
      quantity: 100,
      userId,
    });

    const result = await registerItemExit.execute({
      itemId: entryItem.id,
      quantity: 25,
      userId,
      movementType: 'PRODUCTION',
      reasonCode: 'Used in assembly',
    });

    expect(result.movement.movementType).toBe('PRODUCTION');
    expect(result.item.currentQuantity).toBe(75);
  });

  it('should be able to register exit for sample', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
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

    const { location } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-006',
      variantId: variant.id.toString(),
      locationId: location.id.toString(),
      quantity: 100,
      userId,
    });

    const result = await registerItemExit.execute({
      itemId: entryItem.id,
      quantity: 2,
      userId,
      movementType: 'SAMPLE',
      reasonCode: 'Quality control testing',
    });

    expect(result.movement.movementType).toBe('SAMPLE');
    expect(result.item.currentQuantity).toBe(98);
  });

  it('should handle multiple exits from same item', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: 'string' },
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

    const { location } = await createLocation.execute({
      code: 'WH-A',
      titulo: 'Warehouse A',
      type: 'WAREHOUSE',
    });

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-007',
      variantId: variant.id.toString(),
      locationId: location.id.toString(),
      quantity: 100,
      userId,
    });

    await registerItemExit.execute({
      itemId: entryItem.id,
      quantity: 20,
      userId,
      movementType: 'SALE',
    });

    await registerItemExit.execute({
      itemId: entryItem.id,
      quantity: 15,
      userId,
      movementType: 'SALE',
    });

    const result = await registerItemExit.execute({
      itemId: entryItem.id,
      quantity: 10,
      userId,
      movementType: 'LOSS',
    });

    expect(result.item.currentQuantity).toBe(55);
  });
});

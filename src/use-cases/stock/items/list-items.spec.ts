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
import { ListItemsUseCase } from './list-items';
import { RegisterItemEntryUseCase } from './register-item-entry';

let itemsRepository: InMemoryItemsRepository;
let variantsRepository: InMemoryVariantsRepository;
let locationsRepository: InMemoryLocationsRepository;
let itemMovementsRepository: InMemoryItemMovementsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let suppliersRepository: InMemorySuppliersRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let registerItemEntry: RegisterItemEntryUseCase;
let listItems: ListItemsUseCase;
let createVariant: CreateVariantUseCase;
let createLocation: CreateLocationUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

describe('ListItemsUseCase', () => {
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
    listItems = new ListItemsUseCase(itemsRepository);
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

  it('should be able to list items by variant', async () => {
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

    const { variant } = await createVariant.execute({
      productId: product.id,
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { location } = await createLocation.execute({
      code: 'WH-A',
      description: 'Warehouse A',
      locationType: 'WAREHOUSE',
    });

    const userId = new UniqueEntityID().toString();

    await registerItemEntry.execute({
      uniqueCode: 'ITEM-001',
      variantId: variant.id,
      locationId: location.id,
      quantity: 100,
      userId,
    });

    await registerItemEntry.execute({
      uniqueCode: 'ITEM-002',
      variantId: variant.id,
      locationId: location.id,
      quantity: 50,
      userId,
    });

    const result = await listItems.execute({
      variantId: variant.id,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].uniqueCode).toBe('ITEM-001');
    expect(result.items[1].uniqueCode).toBe('ITEM-002');
  });

  it('should be able to list items by location', async () => {
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

    const { variant } = await createVariant.execute({
      productId: product.id,
      sku: 'SKU-001',
      name: 'Test Variant',
      price: 100,
    });

    const { location: locationA } = await createLocation.execute({
      code: 'WH-A',
      description: 'Warehouse A',
      locationType: 'WAREHOUSE',
    });

    const { location: locationB } = await createLocation.execute({
      code: 'WH-B',
      description: 'Warehouse B',
      locationType: 'WAREHOUSE',
    });

    const userId = new UniqueEntityID().toString();

    await registerItemEntry.execute({
      uniqueCode: 'ITEM-003',
      variantId: variant.id,
      locationId: locationA.id,
      quantity: 100,
      userId,
    });

    await registerItemEntry.execute({
      uniqueCode: 'ITEM-004',
      variantId: variant.id,
      locationId: locationB.id,
      quantity: 50,
      userId,
    });

    const result = await listItems.execute({
      locationId: locationA.id,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].uniqueCode).toBe('ITEM-003');
  });

  it('should return empty array when no filters provided', async () => {
    const result = await listItems.execute({});

    expect(result.items).toHaveLength(0);
  });
});

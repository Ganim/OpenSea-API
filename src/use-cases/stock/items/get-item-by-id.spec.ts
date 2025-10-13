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
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateLocationUseCase } from '../locations/create-location';
import { CreateProductUseCase } from '../products/create-product';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateVariantUseCase } from '../variants/create-variant';
import { GetItemByIdUseCase } from './get-item-by-id';
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
let getItemById: GetItemByIdUseCase;
let createVariant: CreateVariantUseCase;
let createLocation: CreateLocationUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;

describe('GetItemByIdUseCase', () => {
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
    getItemById = new GetItemByIdUseCase(itemsRepository);
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

  it('should be able to get an item by id', async () => {
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

    const { item: entryItem } = await registerItemEntry.execute({
      uniqueCode: 'ITEM-001',
      variantId: variant.id,
      locationId: location.id,
      quantity: 100,
      userId,
    });

    const result = await getItemById.execute({
      id: entryItem.id,
    });

    expect(result.item).toBeDefined();
    expect(result.item.id).toBe(entryItem.id);
    expect(result.item.uniqueCode).toBe('ITEM-001');
    expect(result.item.currentQuantity).toBe(100);
  });

  it('should throw error if item not found', async () => {
    await expect(() =>
      getItemById.execute({
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});

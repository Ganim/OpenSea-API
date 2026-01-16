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
import { GetItemByIdUseCase } from './get-item-by-id';
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
let getItemById: GetItemByIdUseCase;
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

describe('GetItemByIdUseCase', () => {
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

    getItemById = new GetItemByIdUseCase(itemsRepository);

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

  it('should be able to get an item by id', async () => {
    const { template } = await createTemplate.execute({
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      name: 'Test Product',
      code: 'PROD-001',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id.toString(),
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
      uniqueCode: 'ITEM-001',
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
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

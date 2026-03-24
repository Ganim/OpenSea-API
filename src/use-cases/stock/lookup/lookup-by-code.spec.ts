import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { LookupByCodeUseCase } from './lookup-by-code';

const TENANT_ID = 'tenant-1';

let itemsRepository: InMemoryItemsRepository;
let variantsRepository: InMemoryVariantsRepository;
let productsRepository: InMemoryProductsRepository;
let binsRepository: InMemoryBinsRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let zonesRepository: InMemoryZonesRepository;
let sut: LookupByCodeUseCase;

describe('LookupByCodeUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    variantsRepository = new InMemoryVariantsRepository();
    productsRepository = new InMemoryProductsRepository();
    binsRepository = new InMemoryBinsRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    zonesRepository = new InMemoryZonesRepository();

    sut = new LookupByCodeUseCase(
      itemsRepository,
      variantsRepository,
      productsRepository,
      binsRepository,
    );
  });

  it('should find an item by fullCode pattern', async () => {
    const itemFullCode = '001.003.0012.002-00045';

    await itemsRepository.create({
      tenantId: TENANT_ID,
      slug: Slug.createFromText('test-item'),
      fullCode: itemFullCode,
      sequentialCode: 45,
      barcode: 'BC-123',
      eanCode: 'EAN-123',
      upcCode: 'UPC-123',
      variantId: new UniqueEntityID(),
      initialQuantity: 10,
      currentQuantity: 10,
      status: ItemStatus.create('AVAILABLE'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: itemFullCode,
    });

    expect(result.entityType).toBe('ITEM');
    expect(result.entityId).toBeDefined();
    expect(result.entity.fullCode).toBe(itemFullCode);
  });

  it('should find a variant by fullCode pattern', async () => {
    const variantFullCode = '001.003.0012.002';

    await variantsRepository.create({
      tenantId: TENANT_ID,
      productId: new UniqueEntityID(),
      slug: Slug.createFromText('test-variant'),
      fullCode: variantFullCode,
      sequentialCode: 2,
      name: 'Test Variant',
      price: 100,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: variantFullCode,
    });

    expect(result.entityType).toBe('VARIANT');
    expect(result.entity.fullCode).toBe(variantFullCode);
  });

  it('should find a product by fullCode pattern', async () => {
    const productFullCode = '001.003.0012';

    await productsRepository.create({
      tenantId: TENANT_ID,
      name: 'Test Product',
      slug: Slug.createFromText('test-product'),
      fullCode: productFullCode,
      barcode: 'BC-PROD',
      eanCode: 'EAN-PROD',
      upcCode: 'UPC-PROD',
      templateId: new UniqueEntityID(),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: productFullCode,
    });

    expect(result.entityType).toBe('PRODUCT');
    expect(result.entity.fullCode).toBe(productFullCode);
  });

  it('should find a bin by address pattern', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: TENANT_ID,
      code: 'FAB',
      name: 'Fabrica',
    });

    const zone = await zonesRepository.create({
      tenantId: TENANT_ID,
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });

    const binAddress = 'FAB-EST-102-B';
    await binsRepository.create({
      tenantId: TENANT_ID,
      zoneId: zone.zoneId,
      address: binAddress,
      aisle: 1,
      shelf: 2,
      position: 'B',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: binAddress,
    });

    expect(result.entityType).toBe('BIN');
  });

  it('should find an item by barcode (fallback)', async () => {
    const barcode = 'CUSTOM-BARCODE-12345';

    await itemsRepository.create({
      tenantId: TENANT_ID,
      slug: Slug.createFromText('test-item-bc'),
      fullCode: '001.001.0001.001-00001',
      sequentialCode: 1,
      barcode,
      eanCode: 'EAN-001',
      upcCode: 'UPC-001',
      variantId: new UniqueEntityID(),
      initialQuantity: 5,
      currentQuantity: 5,
      status: ItemStatus.create('AVAILABLE'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: barcode,
    });

    expect(result.entityType).toBe('ITEM');
    expect(result.entity.barcode).toBe(barcode);
  });

  it('should find an item by eanCode (fallback)', async () => {
    const eanCode = '5901234123457';

    await itemsRepository.create({
      tenantId: TENANT_ID,
      slug: Slug.createFromText('test-item-ean'),
      fullCode: '001.001.0001.001-00002',
      sequentialCode: 2,
      barcode: 'BC-002',
      eanCode,
      upcCode: 'UPC-002',
      variantId: new UniqueEntityID(),
      initialQuantity: 5,
      currentQuantity: 5,
      status: ItemStatus.create('AVAILABLE'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: eanCode,
    });

    expect(result.entityType).toBe('ITEM');
    expect(result.entity.barcode).toBeDefined();
  });

  it('should find an item by upcCode (fallback)', async () => {
    const upcCode = '012345678905';

    await itemsRepository.create({
      tenantId: TENANT_ID,
      slug: Slug.createFromText('test-item-upc'),
      fullCode: '001.001.0001.001-00003',
      sequentialCode: 3,
      barcode: 'BC-003',
      eanCode: 'EAN-003',
      upcCode,
      variantId: new UniqueEntityID(),
      initialQuantity: 5,
      currentQuantity: 5,
      status: ItemStatus.create('AVAILABLE'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: upcCode,
    });

    expect(result.entityType).toBe('ITEM');
    expect(result.entity.barcode).toBeDefined();
  });

  it('should throw ResourceNotFoundError if nothing found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'NONEXISTENT-CODE',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not find entities from different tenant', async () => {
    await itemsRepository.create({
      tenantId: 'other-tenant',
      slug: Slug.createFromText('other-item'),
      fullCode: '001.001.0001.001-00010',
      sequentialCode: 10,
      barcode: 'BC-OTHER',
      eanCode: 'EAN-OTHER',
      upcCode: 'UPC-OTHER',
      variantId: new UniqueEntityID(),
      initialQuantity: 5,
      currentQuantity: 5,
      status: ItemStatus.create('AVAILABLE'),
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: '001.001.0001.001-00010',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryItemMovementsRepository } from '@/repositories/stock/in-memory/in-memory-item-movements-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryCategoriesRepository } from '@/repositories/stock/in-memory/in-memory-categories-repository';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import type { TransactionManager } from '@/lib/transaction-manager';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

const fakeTransactionManager: TransactionManager = {
  run: (fn) => fn(null as never),
};
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
let manufacturersRepository: InMemoryManufacturersRepository;
let categoriesRepository: InMemoryCategoriesRepository;
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
  options?: { zoneCode?: string; allowsFractionalSale?: boolean },
) {
  const tenantId = 'tenant-1';
  const zoneCode = options?.zoneCode ?? 'EST';

  // Create warehouse if needed
  let warehouse = await warehousesRepo.findByCode('FAB', tenantId);
  if (!warehouse) {
    warehouse = await warehousesRepo.create({
      tenantId,
      code: 'FAB',
      name: 'Fábrica Principal',
    });
  }

  // Create zone if needed
  let zone = await zonesRepo.findByCode(
    warehouse.warehouseId,
    zoneCode,
    tenantId,
  );
  if (!zone) {
    zone = await zonesRepo.create({
      tenantId,
      warehouseId: warehouse.warehouseId,
      code: zoneCode,
      name: zoneCode === 'EST' ? 'Estoque' : `Zona ${zoneCode}`,
    });
    if (options?.allowsFractionalSale) {
      zone.allowsFractionalSale = true;
    }
  }

  // Create bin
  const bin = await binsRepo.create({
    tenantId,
    zoneId: zone.zoneId,
    address: `FAB-${zoneCode}-${code}`,
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
    manufacturersRepository = new InMemoryManufacturersRepository();
    categoriesRepository = new InMemoryCategoriesRepository();

    registerItemEntry = new RegisterItemEntryUseCase(
      itemsRepository,
      variantsRepository,
      binsRepository,
      itemMovementsRepository,
      productsRepository,
      templatesRepository,
      fakeTransactionManager,
    );

    transferItem = new TransferItemUseCase(
      itemsRepository,
      binsRepository,
      itemMovementsRepository,
      fakeTransactionManager,
      zonesRepository,
      variantsRepository,
    );

    createVariant = new CreateVariantUseCase(
      variantsRepository,
      productsRepository,
      templatesRepository,
    );

    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      manufacturersRepository,
      categoriesRepository,
    );

    createTemplate = new CreateTemplateUseCase(templatesRepository);
  });

  it('should be able to transfer an item to a different bin', async () => {
    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',

      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
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
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-001',
      variantId: variant.id.toString(),
      binId: binA.binId.toString(),
      quantity: 100,
      userId,
    });

    const result = await transferItem.execute({
      tenantId: 'tenant-1',
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
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',

      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
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
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-002',
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
      quantity: 50,
      userId,
    });

    await expect(() =>
      transferItem.execute({
        tenantId: 'tenant-1',
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
        tenantId: 'tenant-1',
        itemId: new UniqueEntityID().toString(),
        destinationBinId: bin.binId.toString(),
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow transfer to non-existent bin', async () => {
    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',

      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
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
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-003',
      variantId: variant.id.toString(),
      binId: bin.binId.toString(),
      quantity: 30,
      userId,
    });

    await expect(() =>
      transferItem.execute({
        tenantId: 'tenant-1',
        itemId: entryItem.id,
        destinationBinId: new UniqueEntityID().toString(),
        userId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should create movement record with destination reference', async () => {
    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',

      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
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
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-004',
      variantId: variant.id.toString(),
      binId: binA.binId.toString(),
      quantity: 25,
      userId,
    });

    const result = await transferItem.execute({
      tenantId: 'tenant-1',
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
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',

      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
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
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-005',
      variantId: variant.id.toString(),
      binId: binA.binId.toString(),
      quantity: 100,
      userId,
    });

    // First transfer: A -> B
    await transferItem.execute({
      tenantId: 'tenant-1',
      itemId: entryItem.id,
      destinationBinId: binB.binId.toString(),
      userId,
    });

    // Second transfer: B -> C
    const finalResult = await transferItem.execute({
      tenantId: 'tenant-1',
      itemId: entryItem.id,
      destinationBinId: binC.binId.toString(),
      userId,
    });

    expect(finalResult.item.binId).toBe(binC.binId.toString());
    expect(finalResult.item.currentQuantity).toBe(100);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Fase 1 (Emporion) — fractional zone transition tests
  // ────────────────────────────────────────────────────────────────────────

  it('retorna shouldOfferFractionalConfirmation=true ao mover para zona fracional quando variante permite', async () => {
    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'SKU-FRAC-1',
      name: 'Fractional Variant',
      price: 100,
    });
    // Mark variant as fractional-allowed
    variant.fractionalAllowed = true;
    await variantsRepository.save(variant);

    // Origin zone: non-fractional (default EST)
    const { bin: binA } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    // Destination zone: fractional-enabled (different zone code)
    const { bin: binB } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'B',
      { zoneCode: 'FRAC', allowsFractionalSale: true },
    );

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-FRAC-1',
      variantId: variant.id.toString(),
      binId: binA.binId.toString(),
      quantity: 10,
      userId,
    });

    const result = await transferItem.execute({
      tenantId: 'tenant-1',
      itemId: entryItem.id,
      destinationBinId: binB.binId.toString(),
      userId,
    });

    expect(result.shouldOfferFractionalConfirmation).toBe(true);
    expect(result.item.fractionalSaleEnabled).toBe(false); // not yet confirmed
  });

  it('ativa fractionalSaleEnabled quando confirmFractionalSale=true', async () => {
    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'SKU-FRAC-2',
      name: 'Fractional Variant',
      price: 100,
    });
    variant.fractionalAllowed = true;
    await variantsRepository.save(variant);

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
      { zoneCode: 'FRAC', allowsFractionalSale: true },
    );

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-FRAC-2',
      variantId: variant.id.toString(),
      binId: binA.binId.toString(),
      quantity: 10,
      userId,
    });

    const result = await transferItem.execute({
      tenantId: 'tenant-1',
      itemId: entryItem.id,
      destinationBinId: binB.binId.toString(),
      userId,
      confirmFractionalSale: true,
    });

    expect(result.item.fractionalSaleEnabled).toBe(true);
    expect(result.shouldOfferFractionalConfirmation).toBe(false);
  });

  it('desliga fractionalSaleEnabled ao mover para zona sem allowsFractionalSale', async () => {
    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'SKU-FRAC-3',
      name: 'Fractional Variant',
      price: 100,
    });
    variant.fractionalAllowed = true;
    await variantsRepository.save(variant);

    // Origin zone: fractional-enabled
    const { bin: binA } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
      { zoneCode: 'FRAC', allowsFractionalSale: true },
    );

    // Destination zone: non-fractional
    const { bin: binB } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'B',
    );

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-FRAC-3',
      variantId: variant.id.toString(),
      binId: binA.binId.toString(),
      quantity: 10,
      userId,
    });

    // Pre-condition: enable fractional on the item before the transfer
    const itemEntity = await itemsRepository.findById(
      new UniqueEntityID(entryItem.id),
      'tenant-1',
    );
    expect(itemEntity).not.toBeNull();
    itemEntity!.fractionalSaleEnabled = true;
    await itemsRepository.save(itemEntity!);

    const result = await transferItem.execute({
      tenantId: 'tenant-1',
      itemId: entryItem.id,
      destinationBinId: binB.binId.toString(),
      userId,
    });

    expect(result.item.fractionalSaleEnabled).toBe(false);
    expect(result.shouldOfferFractionalConfirmation).toBe(false);
  });

  it('não oferece confirmação quando variante.fractionalAllowed=false', async () => {
    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',
      status: 'ACTIVE',
      attributes: { brand: 'Samsung' },
      templateId: template.id,
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'SKU-FRAC-4',
      name: 'Non-fractional Variant',
      price: 100,
    });
    // variant.fractionalAllowed defaults to false — leave as is

    const { bin: binA } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'A',
    );

    // Destination zone allows fractional, but variant doesn't
    const { bin: binB } = await createTestBin(
      warehousesRepository,
      zonesRepository,
      binsRepository,
      'B',
      { zoneCode: 'FRAC', allowsFractionalSale: true },
    );

    const userId = new UniqueEntityID().toString();

    const { item: entryItem } = await registerItemEntry.execute({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-FRAC-4',
      variantId: variant.id.toString(),
      binId: binA.binId.toString(),
      quantity: 10,
      userId,
    });

    const result = await transferItem.execute({
      tenantId: 'tenant-1',
      itemId: entryItem.id,
      destinationBinId: binB.binId.toString(),
      userId,
    });

    expect(result.shouldOfferFractionalConfirmation).toBe(false);
    expect(result.item.fractionalSaleEnabled).toBe(false); // unchanged
  });
});

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckStockAlertsUseCase } from './check-stock-alerts';

const TENANT_ID = 'tenant-1';

let variantsRepository: InMemoryVariantsRepository;
let itemsRepository: InMemoryItemsRepository;
let notificationsRepository: InMemoryNotificationsRepository;
let sut: CheckStockAlertsUseCase;

async function createVariantWithReorderPoint(
  name: string,
  reorderPoint: number,
  reorderQuantity?: number,
) {
  const productId = new UniqueEntityID();
  const seq = variantsRepository.items.length + 1;
  const variant = await variantsRepository.create({
    tenantId: TENANT_ID,
    productId,
    slug: Slug.createUniqueFromText(name, `${seq}`),
    fullCode: `001.001.${String(seq).padStart(4, '0')}`,
    sequentialCode: seq,
    name,
    price: 10,
    reorderPoint,
    reorderQuantity,
  });
  return variant;
}

async function createItemForVariant(
  variantId: UniqueEntityID,
  currentQuantity: number,
) {
  const seq = itemsRepository.items.length + 1;
  return itemsRepository.create({
    tenantId: TENANT_ID,
    slug: Slug.createUniqueFromText('item', `${seq}`),
    fullCode: `001.001.0001.001-${String(seq).padStart(5, '0')}`,
    sequentialCode: seq,
    barcode: `BAR-${seq}`,
    eanCode: `EAN-${seq}`,
    upcCode: `UPC-${seq}`,
    variantId,
    initialQuantity: currentQuantity,
    currentQuantity,
    status: ItemStatus.create('AVAILABLE'),
  });
}

describe('CheckStockAlertsUseCase', () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    itemsRepository = new InMemoryItemsRepository();
    notificationsRepository = new InMemoryNotificationsRepository();
    sut = new CheckStockAlertsUseCase(
      variantsRepository,
      itemsRepository,
      notificationsRepository,
    );
  });

  it('should return no alerts when all variants are above reorder point', async () => {
    const variant = await createVariantWithReorderPoint('Camiseta P', 5);
    await createItemForVariant(variant.id, 10);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.alerts).toHaveLength(0);
    expect(result.notificationsCreated).toBe(0);
  });

  it('should return alert when variant is below reorder point', async () => {
    const variant = await createVariantWithReorderPoint('Camiseta M', 10, 50);
    await createItemForVariant(variant.id, 3);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].variantId).toBe(variant.id.toString());
    expect(result.alerts[0].variantName).toBe('Camiseta M');
    expect(result.alerts[0].currentQuantity).toBe(3);
    expect(result.alerts[0].reorderPoint).toBe(10);
    expect(result.alerts[0].deficit).toBe(7);
    expect(result.alerts[0].reorderQuantity).toBe(50);
  });

  it('should sum quantities across multiple items of same variant', async () => {
    const variant = await createVariantWithReorderPoint('Camiseta G', 20);
    await createItemForVariant(variant.id, 5);
    await createItemForVariant(variant.id, 8);

    const result = await sut.execute({ tenantId: TENANT_ID });

    // 5 + 8 = 13 < 20
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].currentQuantity).toBe(13);
    expect(result.alerts[0].deficit).toBe(7);
  });

  it('should create notifications when notifyUserId is provided', async () => {
    const variant = await createVariantWithReorderPoint('Camiseta GG', 10);
    await createItemForVariant(variant.id, 2);
    const userId = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      notifyUserId: userId,
    });

    expect(result.alerts).toHaveLength(1);
    expect(result.notificationsCreated).toBe(1);
    expect(notificationsRepository.items).toHaveLength(1);
    expect(notificationsRepository.items[0].type).toBe('WARNING');
  });

  it('should not duplicate notifications for the same variant', async () => {
    const variant = await createVariantWithReorderPoint('Camiseta XG', 10);
    await createItemForVariant(variant.id, 2);
    const userId = new UniqueEntityID().toString();

    // First call
    await sut.execute({ tenantId: TENANT_ID, notifyUserId: userId });
    // Second call
    const result = await sut.execute({
      tenantId: TENANT_ID,
      notifyUserId: userId,
    });

    expect(result.alerts).toHaveLength(1);
    expect(result.notificationsCreated).toBe(0);
    expect(notificationsRepository.items).toHaveLength(1);
  });

  it('should not create notifications when notifyUserId is not provided', async () => {
    const variant = await createVariantWithReorderPoint('Camiseta PP', 10);
    await createItemForVariant(variant.id, 2);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.alerts).toHaveLength(1);
    expect(result.notificationsCreated).toBe(0);
  });

  it('should work without notifications repository', async () => {
    const sutWithoutNotifications = new CheckStockAlertsUseCase(
      variantsRepository,
      itemsRepository,
    );

    const variant = await createVariantWithReorderPoint('Camiseta S', 10);
    await createItemForVariant(variant.id, 2);

    const result = await sutWithoutNotifications.execute({
      tenantId: TENANT_ID,
    });

    expect(result.alerts).toHaveLength(1);
    expect(result.notificationsCreated).toBe(0);
  });

  it('should return empty alerts when no variants have reorder points', async () => {
    // Variant without reorder point
    const productId = new UniqueEntityID();
    await variantsRepository.create({
      tenantId: TENANT_ID,
      productId,
      slug: Slug.createUniqueFromText('variant', '1'),
      fullCode: '001.001.0001',
      sequentialCode: 1,
      name: 'No Reorder Point',
      price: 10,
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.alerts).toHaveLength(0);
  });

  it('should handle variant with zero items (all below reorder)', async () => {
    const _variant = await createVariantWithReorderPoint('Empty Variant', 5);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].currentQuantity).toBe(0);
    expect(result.alerts[0].deficit).toBe(5);
  });
});

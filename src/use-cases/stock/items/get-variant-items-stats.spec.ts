import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetVariantItemsStatsUseCase } from './get-variant-items-stats';

let itemsRepository: InMemoryItemsRepository;
let sut: GetVariantItemsStatsUseCase;

describe('GetVariantItemsStatsUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    sut = new GetVariantItemsStatsUseCase(itemsRepository);
  });

  const makeItem = async (
    tenantId: string,
    variantId: UniqueEntityID,
    suffix: string,
    currentQuantity: number,
  ) => {
    await itemsRepository.create({
      tenantId,
      uniqueCode: `ITEM-${suffix}`,
      slug: Slug.createFromText(`item-${suffix}`),
      fullCode: `001.001.0001.001-${suffix}`,
      sequentialCode: Number(suffix),
      barcode: `BC${suffix}`,
      eanCode: `EAN${suffix.padStart(10, '0')}`,
      upcCode: `UPC${suffix.padStart(9, '0')}`,
      variantId,
      initialQuantity: currentQuantity,
      currentQuantity,
      status: ItemStatus.create('AVAILABLE'),
    });
  };

  it('aggregates counts and quantities across all items, ignoring the 20-item pagination cap', async () => {
    const variantId = new UniqueEntityID();
    // 24 itens com quantidade 5 cada — total de 120, todos em estoque.
    for (let i = 1; i <= 24; i++) {
      await makeItem('tenant-1', variantId, String(i).padStart(5, '0'), 5);
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: variantId.toString(),
    });

    expect(result.totalItems).toBe(24);
    expect(result.inStockItems).toBe(24);
    expect(result.totalQuantity).toBe(120);
    expect(result.inStockQuantity).toBe(120);
  });

  it('separa itens com quantidade zero do total em estoque', async () => {
    const variantId = new UniqueEntityID();
    await makeItem('tenant-1', variantId, '00001', 10);
    await makeItem('tenant-1', variantId, '00002', 0); // exited
    await makeItem('tenant-1', variantId, '00003', 3);
    await makeItem('tenant-1', variantId, '00004', 0); // exited

    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: variantId.toString(),
    });

    expect(result.totalItems).toBe(4);
    expect(result.inStockItems).toBe(2);
    expect(result.totalQuantity).toBe(13);
    expect(result.inStockQuantity).toBe(13);
  });

  it('retorna zeros quando a variante não tem itens', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: new UniqueEntityID().toString(),
    });

    expect(result).toEqual({
      totalItems: 0,
      inStockItems: 0,
      totalQuantity: 0,
      inStockQuantity: 0,
    });
  });

  it('isola stats por tenant', async () => {
    const variantId = new UniqueEntityID();
    await makeItem('tenant-1', variantId, '00001', 10);
    await makeItem('tenant-2', variantId, '00002', 99);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: variantId.toString(),
    });

    expect(result.totalItems).toBe(1);
    expect(result.totalQuantity).toBe(10);
  });
});

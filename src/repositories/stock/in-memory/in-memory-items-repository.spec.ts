import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { Slug } from '@/entities/stock/value-objects/slug';

import { InMemoryItemsRepository } from './in-memory-items-repository';

const tenantId = new UniqueEntityID().toString();
const otherTenantId = new UniqueEntityID().toString();

let repository: InMemoryItemsRepository;

function buildItemAtZone(args: {
  zoneId: string;
  binId?: UniqueEntityID;
  tenantIdOverride?: string;
  variantId?: UniqueEntityID;
}): Item {
  const binId = args.binId ?? new UniqueEntityID();
  repository.relatedData.bins.set(binId.toString(), {
    address: 'A1',
    zoneId: args.zoneId,
  });

  const item = Item.create({
    tenantId: new UniqueEntityID(args.tenantIdOverride ?? tenantId),
    slug: Slug.createFromText(`item-${new UniqueEntityID().toString()}`),
    fullCode: `001.001.0001.001-${Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, '0')}`,
    barcode: `IB${new UniqueEntityID().toString().slice(0, 8)}`,
    eanCode: `IE${Math.floor(Math.random() * 1e11)
      .toString()
      .padStart(11, '0')}`,
    upcCode: `IU${Math.floor(Math.random() * 1e10)
      .toString()
      .padStart(10, '0')}`,
    variantId: args.variantId ?? new UniqueEntityID(),
    binId,
    initialQuantity: 5,
    currentQuantity: 5,
    entryDate: new Date(),
  });

  repository.items.push(item);
  return item;
}

describe('InMemoryItemsRepository — findManyByZoneIdsPaginated', () => {
  beforeEach(() => {
    repository = new InMemoryItemsRepository();
  });

  it('returns { items: [], nextCursor: null } when zoneIds is empty', async () => {
    const result = await repository.findManyByZoneIdsPaginated([], tenantId, {
      limit: 10,
    });

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it('returns the first page sorted by id ASC and a non-null nextCursor when more items remain', async () => {
    const zoneId = new UniqueEntityID().toString();
    // 5 items in scope; ask for 3 → page contains 3, nextCursor = id of 3rd
    const created = [
      buildItemAtZone({ zoneId }),
      buildItemAtZone({ zoneId }),
      buildItemAtZone({ zoneId }),
      buildItemAtZone({ zoneId }),
      buildItemAtZone({ zoneId }),
    ];

    const expectedSortedIds = created
      .map((item) => item.id.toString())
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const result = await repository.findManyByZoneIdsPaginated(
      [zoneId],
      tenantId,
      { limit: 3 },
    );

    expect(result.items).toHaveLength(3);
    expect(result.items.map((item) => item.id.toString())).toEqual(
      expectedSortedIds.slice(0, 3),
    );
    expect(result.nextCursor).toBe(expectedSortedIds[2]);
  });

  it('continues from cursor and excludes items whose id is <= cursor', async () => {
    const zoneId = new UniqueEntityID().toString();
    const created = [
      buildItemAtZone({ zoneId }),
      buildItemAtZone({ zoneId }),
      buildItemAtZone({ zoneId }),
      buildItemAtZone({ zoneId }),
      buildItemAtZone({ zoneId }),
    ];
    const sortedIds = created
      .map((item) => item.id.toString())
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const firstPage = await repository.findManyByZoneIdsPaginated(
      [zoneId],
      tenantId,
      { limit: 2 },
    );
    expect(firstPage.nextCursor).toBe(sortedIds[1]);

    const secondPage = await repository.findManyByZoneIdsPaginated(
      [zoneId],
      tenantId,
      { cursor: firstPage.nextCursor ?? undefined, limit: 2 },
    );

    expect(secondPage.items.map((item) => item.id.toString())).toEqual(
      sortedIds.slice(2, 4),
    );
    expect(secondPage.nextCursor).toBe(sortedIds[3]);
  });

  it('marks the final page with nextCursor === null when fewer items remain than the limit', async () => {
    const zoneId = new UniqueEntityID().toString();
    const created = [
      buildItemAtZone({ zoneId }),
      buildItemAtZone({ zoneId }),
      buildItemAtZone({ zoneId }),
    ];
    const sortedIds = created
      .map((item) => item.id.toString())
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    // limit higher than remaining items — should still return the page and
    // signal completion via nextCursor === null
    const result = await repository.findManyByZoneIdsPaginated(
      [zoneId],
      tenantId,
      { limit: 10 },
    );

    expect(result.items.map((item) => item.id.toString())).toEqual(sortedIds);
    expect(result.nextCursor).toBeNull();
  });

  it('respects tenant isolation, excludes soft-deleted items, and skips items whose bin is not in the zone scope', async () => {
    const zoneId = new UniqueEntityID().toString();
    const otherZoneId = new UniqueEntityID().toString();

    const inScope = buildItemAtZone({ zoneId });
    buildItemAtZone({ zoneId, tenantIdOverride: otherTenantId });
    buildItemAtZone({ zoneId: otherZoneId });

    const softDeleted = buildItemAtZone({ zoneId });
    softDeleted.delete();

    const result = await repository.findManyByZoneIdsPaginated(
      [zoneId],
      tenantId,
      { limit: 100 },
    );

    expect(result.items.map((item) => item.id.toString())).toEqual([
      inScope.id.toString(),
    ]);
    expect(result.nextCursor).toBeNull();
  });
});

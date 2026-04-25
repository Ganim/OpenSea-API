import { describe, it, expect } from 'vitest';

import { PosOrderConflict } from '@/entities/sales/pos-order-conflict';

import { InMemoryPosOrderConflictsRepository } from './in-memory-pos-order-conflicts-repository';

describe('InMemoryPosOrderConflictsRepository', () => {
  it('compiles and instantiates', async () => {
    const repo = new InMemoryPosOrderConflictsRepository();
    expect(repo.items).toEqual([]);
  });

  it('creates and queries conflicts', async () => {
    const repo = new InMemoryPosOrderConflictsRepository();
    const conflict = PosOrderConflict.create({
      tenantId: 'tenant-1',
      saleLocalUuid: 'sale-uuid-1',
      posTerminalId: 'terminal-1',
      conflictDetails: [
        {
          itemId: 'item-1',
          variantId: 'variant-1',
          requestedQuantity: 5,
          availableQuantity: 2,
          shortage: 3,
          reason: 'INSUFFICIENT_STOCK',
        },
      ],
    });

    await repo.create(conflict);

    const byId = await repo.findById(conflict.id, 'tenant-1');
    expect(byId?.id.toString()).toBe(conflict.id.toString());

    const byUuid = await repo.findBySaleLocalUuid('sale-uuid-1', 'tenant-1');
    expect(byUuid?.id.toString()).toBe(conflict.id.toString());

    const page = await repo.findManyPaginated({
      tenantId: 'tenant-1',
      page: 1,
      limit: 10,
      status: ['PENDING_RESOLUTION'],
    });
    expect(page.total).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';

import { ConflictDetail, PosOrderConflict } from './pos-order-conflict';
import { PosOrderConflictStatus } from './value-objects/pos-order-conflict-status';

describe('PosOrderConflict entity', () => {
  const detail: ConflictDetail = {
    itemId: 'item-1',
    variantId: 'variant-1',
    requestedQuantity: 5,
    availableQuantity: 2,
    shortage: 3,
    reason: 'INSUFFICIENT_STOCK',
  };

  it('cria com status PENDING_RESOLUTION por padrão', () => {
    const conflict = PosOrderConflict.create({
      tenantId: 'tenant-1',
      saleLocalUuid: 'sale-uuid-1',
      posTerminalId: 'term-1',
      conflictDetails: [detail],
    });

    expect(conflict.status.value).toBe('PENDING_RESOLUTION');
    expect(conflict.orderId).toBeNull();
    expect(conflict.posSessionId).toBeNull();
    expect(conflict.posOperatorEmployeeId).toBeNull();
    expect(conflict.resolvedByUserId).toBeNull();
    expect(conflict.resolvedAt).toBeNull();
    expect(conflict.resolutionDetails).toBeNull();
  });

  it('preserva conflictDetails com reason', () => {
    const conflict = PosOrderConflict.create({
      tenantId: 'tenant-1',
      saleLocalUuid: 'sale-uuid-1',
      posTerminalId: 'term-1',
      conflictDetails: [detail],
    });

    expect(conflict.conflictDetails).toHaveLength(1);
    expect(conflict.conflictDetails[0].reason).toBe('INSUFFICIENT_STOCK');
    expect(conflict.conflictDetails[0].itemId).toBe('item-1');
    expect(conflict.conflictDetails[0].shortage).toBe(3);
  });

  it('resolve() seta status, resolvedAt, resolvedByUserId e resolutionDetails', () => {
    const conflict = PosOrderConflict.create({
      tenantId: 'tenant-1',
      saleLocalUuid: 'sale-uuid-1',
      posTerminalId: 'term-1',
      conflictDetails: [detail],
    });

    conflict.resolve(PosOrderConflictStatus.CANCELED_REFUNDED(), 'user-1', {
      notes: 'test',
    });

    expect(conflict.status.value).toBe('CANCELED_REFUNDED');
    expect(conflict.resolvedByUserId).toBe('user-1');
    expect(conflict.resolvedAt).toBeInstanceOf(Date);
    expect(conflict.resolutionDetails).toEqual({ notes: 'test' });
    expect(conflict.updatedAt).toBeInstanceOf(Date);
  });
});

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PosOrderConflict,
  type ConflictDetail,
  type PosOrderConflictProps,
} from '@/entities/sales/pos-order-conflict';
import { PosOrderConflictStatus } from '@/entities/sales/value-objects/pos-order-conflict-status';

const DEFAULT_CONFLICT_DETAIL: ConflictDetail = {
  itemId: 'item-default',
  variantId: 'variant-default',
  requestedQuantity: 5,
  availableQuantity: 2,
  shortage: 3,
  reason: 'INSUFFICIENT_STOCK',
};

/**
 * Test factory for {@link PosOrderConflict}. All overrides are optional and
 * sensible defaults are provided so most specs only need to pass the IDs they
 * actually want to assert on.
 */
export function makePosOrderConflict(
  override: Partial<PosOrderConflictProps> = {},
  id?: UniqueEntityID,
): PosOrderConflict {
  return PosOrderConflict.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID().toString(),
      saleLocalUuid: override.saleLocalUuid ?? new UniqueEntityID().toString(),
      orderId: override.orderId ?? null,
      posTerminalId: override.posTerminalId ?? new UniqueEntityID().toString(),
      posSessionId: override.posSessionId ?? null,
      posOperatorEmployeeId: override.posOperatorEmployeeId ?? null,
      status: override.status ?? PosOrderConflictStatus.PENDING_RESOLUTION(),
      conflictDetails: override.conflictDetails ?? [DEFAULT_CONFLICT_DETAIL],
      resolutionDetails: override.resolutionDetails ?? null,
      resolvedByUserId: override.resolvedByUserId ?? null,
      resolvedAt: override.resolvedAt ?? null,
      originalCart: override.originalCart ?? null,
      originalPayments: override.originalPayments ?? null,
      originalCustomerData: override.originalCustomerData ?? null,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt,
    },
    id ?? new UniqueEntityID(),
  );
}

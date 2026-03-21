import type { PosCashMovement } from '@/entities/sales/pos-cash-movement';

export interface PosCashMovementDTO {
  id: string;
  tenantId: string;
  sessionId: string;
  type: string;
  amount: number;
  reason: string | null;
  performedByUserId: string;
  authorizedByUserId: string | null;
  createdAt: Date;
}

export function posCashMovementToDTO(
  movement: PosCashMovement,
): PosCashMovementDTO {
  return {
    id: movement.id.toString(),
    tenantId: movement.tenantId.toString(),
    sessionId: movement.sessionId.toString(),
    type: movement.type,
    amount: movement.amount,
    reason: movement.reason ?? null,
    performedByUserId: movement.performedByUserId.toString(),
    authorizedByUserId: movement.authorizedByUserId?.toString() ?? null,
    createdAt: movement.createdAt,
  };
}

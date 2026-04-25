import type {
  ConflictDetail,
  PosOrderConflict,
} from '@/entities/sales/pos-order-conflict';
import type { PosOrderConflictStatusValue } from '@/entities/sales/value-objects/pos-order-conflict-status';

export interface PosOrderConflictDTO {
  id: string;
  tenantId: string;
  saleLocalUuid: string;
  orderId: string | null;
  posTerminalId: string;
  posSessionId: string | null;
  posOperatorEmployeeId: string | null;
  status: PosOrderConflictStatusValue;
  conflictDetails: ConflictDetail[];
  resolutionDetails: Record<string, unknown> | null;
  resolvedByUserId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export function posOrderConflictToDTO(
  entity: PosOrderConflict,
): PosOrderConflictDTO {
  return {
    id: entity.id.toString(),
    tenantId: entity.tenantId,
    saleLocalUuid: entity.saleLocalUuid,
    orderId: entity.orderId,
    posTerminalId: entity.posTerminalId,
    posSessionId: entity.posSessionId,
    posOperatorEmployeeId: entity.posOperatorEmployeeId,
    status: entity.status.value,
    conflictDetails: entity.conflictDetails,
    resolutionDetails: entity.resolutionDetails,
    resolvedByUserId: entity.resolvedByUserId,
    resolvedAt: entity.resolvedAt?.toISOString() ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt?.toISOString() ?? null,
  };
}

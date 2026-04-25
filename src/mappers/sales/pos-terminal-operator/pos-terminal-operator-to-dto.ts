import type { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';

export interface PosTerminalOperatorDTO {
  id: string;
  terminalId: string;
  employeeId: string;
  tenantId: string;
  isActive: boolean;
  assignedAt: string;
  assignedByUserId: string;
  revokedAt: string | null;
  revokedByUserId: string | null;
}

export function posTerminalOperatorToDTO(
  entity: PosTerminalOperator,
): PosTerminalOperatorDTO {
  return {
    id: entity.id.toString(),
    terminalId: entity.terminalId.toString(),
    employeeId: entity.employeeId.toString(),
    tenantId: entity.tenantId,
    isActive: entity.isActive,
    assignedAt: entity.assignedAt.toISOString(),
    assignedByUserId: entity.assignedByUserId.toString(),
    revokedAt: entity.revokedAt?.toISOString() ?? null,
    revokedByUserId: entity.revokedByUserId?.toString() ?? null,
  };
}

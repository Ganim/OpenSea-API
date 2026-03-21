import type { PosSession } from '@/entities/sales/pos-session';

export interface PosSessionDTO {
  id: string;
  tenantId: string;
  terminalId: string;
  operatorUserId: string;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
  openingBalance: number;
  closingBalance: number | null;
  expectedBalance: number | null;
  difference: number | null;
  closingBreakdown: Record<string, unknown> | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function posSessionToDTO(session: PosSession): PosSessionDTO {
  return {
    id: session.id.toString(),
    tenantId: session.tenantId.toString(),
    terminalId: session.terminalId.toString(),
    operatorUserId: session.operatorUserId.toString(),
    status: session.status,
    openedAt: session.openedAt,
    closedAt: session.closedAt ?? null,
    openingBalance: session.openingBalance,
    closingBalance: session.closingBalance ?? null,
    expectedBalance: session.expectedBalance ?? null,
    difference: session.difference ?? null,
    closingBreakdown: session.closingBreakdown ?? null,
    notes: session.notes ?? null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt ?? null,
  };
}

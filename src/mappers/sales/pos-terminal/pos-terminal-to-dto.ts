import type {
  PosTerminal,
  PosTerminalMode,
} from '@/entities/sales/pos-terminal';

export interface PosTerminalDTO {
  id: string;
  tenantId: string;
  terminalName: string;
  terminalCode: string;
  totemCode: string | null;
  mode: PosTerminalMode;
  acceptsPendingOrders: boolean;
  requiresSession: boolean;
  allowAnonymous: boolean;
  systemUserId: string | null;
  defaultPriceTableId: string | null;
  isActive: boolean;
  deletedAt: string | null;
  lastSyncAt: string | null;
  lastOnlineAt: string | null;
  settings: Record<string, unknown> | null;
  // Fase 1 (Emporion) — operator session + coordination + applied profile
  operatorSessionMode: 'PER_SALE' | 'STAY_LOGGED_IN';
  operatorSessionTimeout: number | null;
  autoCloseSessionAt: string | null;
  coordinationMode: 'STANDALONE' | 'SELLER' | 'CASHIER' | 'BOTH';
  appliedProfileId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export function posTerminalToDTO(terminal: PosTerminal): PosTerminalDTO {
  return {
    id: terminal.id.toString(),
    tenantId: terminal.tenantId.toString(),
    terminalName: terminal.terminalName,
    terminalCode: terminal.terminalCode,
    totemCode: terminal.totemCode ?? null,
    mode: terminal.mode,
    acceptsPendingOrders: terminal.acceptsPendingOrders,
    requiresSession: terminal.requiresSession,
    allowAnonymous: terminal.allowAnonymous,
    systemUserId: terminal.systemUserId ?? null,
    defaultPriceTableId: terminal.defaultPriceTableId?.toString() ?? null,
    isActive: terminal.isActive,
    deletedAt: terminal.deletedAt?.toISOString() ?? null,
    lastSyncAt: terminal.lastSyncAt?.toISOString() ?? null,
    lastOnlineAt: terminal.lastOnlineAt?.toISOString() ?? null,
    settings: terminal.settings ?? null,
    operatorSessionMode: terminal.operatorSessionMode.value,
    operatorSessionTimeout: terminal.operatorSessionTimeout ?? null,
    autoCloseSessionAt: terminal.autoCloseSessionAt ?? null,
    coordinationMode: terminal.coordinationMode.value,
    appliedProfileId: terminal.appliedProfileId?.toString() ?? null,
    createdAt: terminal.createdAt.toISOString(),
    updatedAt: terminal.updatedAt?.toISOString() ?? null,
  };
}

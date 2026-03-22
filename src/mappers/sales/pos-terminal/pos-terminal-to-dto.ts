import type { PosTerminal } from '@/entities/sales/pos-terminal';

export interface PosTerminalDTO {
  id: string;
  tenantId: string;
  name: string;
  deviceId: string;
  mode: string;
  cashierMode: string;
  acceptsPendingOrders: boolean;
  warehouseId: string;
  defaultPriceTableId: string | null;
  isActive: boolean;
  lastSyncAt: Date | null;
  lastOnlineAt: Date | null;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function posTerminalToDTO(terminal: PosTerminal): PosTerminalDTO {
  return {
    id: terminal.id.toString(),
    tenantId: terminal.tenantId.toString(),
    name: terminal.name,
    deviceId: terminal.deviceId,
    mode: terminal.mode,
    cashierMode: terminal.cashierMode,
    acceptsPendingOrders: terminal.acceptsPendingOrders,
    warehouseId: terminal.warehouseId.toString(),
    defaultPriceTableId: terminal.defaultPriceTableId?.toString() ?? null,
    isActive: terminal.isActive,
    lastSyncAt: terminal.lastSyncAt ?? null,
    lastOnlineAt: terminal.lastOnlineAt ?? null,
    settings: terminal.settings ?? null,
    createdAt: terminal.createdAt,
    updatedAt: terminal.updatedAt ?? null,
  };
}

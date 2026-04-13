import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PosTerminal,
  type PosTerminalMode,
  type PosTerminalProps,
} from '@/entities/sales/pos-terminal';

export function makePosTerminal(
  override: Partial<PosTerminalProps> = {},
  id?: UniqueEntityID,
): PosTerminal {
  return PosTerminal.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID(),
      terminalName: override.terminalName ?? 'Terminal Test',
      terminalCode: override.terminalCode ?? 'TERM0001',
      mode: override.mode ?? ('SALES_WITH_CHECKOUT' as PosTerminalMode),
      acceptsPendingOrders: override.acceptsPendingOrders ?? false,
      requiresSession: override.requiresSession ?? true,
      allowAnonymous: override.allowAnonymous ?? false,
      isActive: override.isActive ?? true,
      createdAt: override.createdAt ?? new Date(),
      ...override,
    },
    id ?? new UniqueEntityID(),
  );
}

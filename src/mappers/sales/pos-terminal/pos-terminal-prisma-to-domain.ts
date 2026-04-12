import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminal } from '@/entities/sales/pos-terminal';
import type { PosTerminal as PrismaPosTerminal } from '@prisma/generated/client.js';

export function posTerminalPrismaToDomain(raw: PrismaPosTerminal): PosTerminal {
  return PosTerminal.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      terminalName: raw.terminalName,
      terminalCode: raw.terminalCode,
      totemCode: raw.totemCode ?? undefined,
      mode: raw.mode,
      acceptsPendingOrders: raw.acceptsPendingOrders,
      requiresSession: raw.requiresSession,
      allowAnonymous: raw.allowAnonymous,
      systemUserId: raw.systemUserId ?? undefined,
      pairingSecret: raw.pairingSecret ?? undefined,
      defaultPriceTableId: raw.defaultPriceTableId
        ? new UniqueEntityID(raw.defaultPriceTableId)
        : undefined,
      isActive: raw.isActive,
      deletedAt: raw.deletedAt ?? undefined,
      lastSyncAt: raw.lastSyncAt ?? undefined,
      lastOnlineAt: raw.lastOnlineAt ?? undefined,
      settings: raw.settings as Record<string, unknown> | undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

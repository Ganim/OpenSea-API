import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminal } from '@/entities/sales/pos-terminal';
import type { PosTerminal as PrismaPosTerminal } from '@prisma/generated/client.js';

export function posTerminalPrismaToDomain(raw: PrismaPosTerminal): PosTerminal {
  return PosTerminal.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      name: raw.name,
      deviceId: raw.deviceId,
      mode: raw.mode,
      cashierMode: raw.cashierMode,
      acceptsPendingOrders: raw.acceptsPendingOrders,
      warehouseId: new UniqueEntityID(raw.warehouseId),
      defaultPriceTableId: raw.defaultPriceTableId
        ? new UniqueEntityID(raw.defaultPriceTableId)
        : undefined,
      isActive: raw.isActive,
      lastSyncAt: raw.lastSyncAt ?? undefined,
      lastOnlineAt: raw.lastOnlineAt ?? undefined,
      settings: raw.settings as Record<string, unknown> | undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';
import { PosZoneTier } from '@/entities/sales/value-objects/pos-zone-tier';
import type { PosTerminalZone as PrismaPosTerminalZone } from '@prisma/generated/client.js';

export function posTerminalZonePrismaToDomain(
  raw: PrismaPosTerminalZone,
): PosTerminalZone {
  return PosTerminalZone.create(
    {
      terminalId: new UniqueEntityID(raw.terminalId),
      zoneId: new UniqueEntityID(raw.zoneId),
      tier: PosZoneTier.create(raw.tier),
      tenantId: raw.tenantId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}

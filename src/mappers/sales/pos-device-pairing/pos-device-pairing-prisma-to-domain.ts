import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import type { PosDevicePairing as PrismaPosDevicePairing } from '@prisma/generated/client.js';

export function posDevicePairingPrismaToDomain(
  raw: PrismaPosDevicePairing,
): PosDevicePairing {
  return PosDevicePairing.create(
    {
      id: raw.id,
      tenantId: new UniqueEntityID(raw.tenantId),
      terminalId: new UniqueEntityID(raw.terminalId),
      deviceLabel: raw.deviceLabel,
      deviceTokenHash: raw.deviceTokenHash,
      pairedAt: raw.pairedAt,
      lastSeenAt: raw.lastSeenAt ?? undefined,
      pairedByUserId: raw.pairedByUserId,
      revokedAt: raw.revokedAt ?? undefined,
      revokedByUserId: raw.revokedByUserId ?? undefined,
      revokedReason: raw.revokedReason ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}

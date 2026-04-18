import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PunchDevice,
  type PunchDeviceKind,
  type PunchDeviceStatus,
} from '@/entities/hr/punch-device';
import type { PunchDevice as PrismaPunchDevice } from '@prisma/generated/client.js';

/**
 * Converte a linha Prisma para a entity de domínio. Valores `null` do
 * banco viram `undefined` em `Optional<...>` para casar com o shape
 * da entity (que usa `?:` em campos opcionais).
 */
export function punchDevicePrismaToDomain(raw: PrismaPunchDevice): PunchDevice {
  return PunchDevice.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      name: raw.name,
      deviceKind: raw.deviceKind as PunchDeviceKind,
      pairingSecret: raw.pairingSecret,
      deviceTokenHash: raw.deviceTokenHash ?? undefined,
      deviceLabel: raw.deviceLabel ?? undefined,
      geofenceZoneId: raw.geofenceZoneId
        ? new UniqueEntityID(raw.geofenceZoneId)
        : undefined,
      pairedAt: raw.pairedAt ?? undefined,
      pairedByUserId: raw.pairedByUserId ?? undefined,
      revokedAt: raw.revokedAt ?? undefined,
      revokedByUserId: raw.revokedByUserId ?? undefined,
      revokedReason: raw.revokedReason ?? undefined,
      status: raw.status as PunchDeviceStatus,
      lastSeenAt: raw.lastSeenAt ?? undefined,
      ipAddress: raw.ipAddress ?? undefined,
      hostname: raw.hostname ?? undefined,
      osInfo: (raw.osInfo as Record<string, unknown>) ?? undefined,
      version: raw.version ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}

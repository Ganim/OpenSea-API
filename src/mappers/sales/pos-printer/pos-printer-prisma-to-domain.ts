import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosPrinter } from '@/entities/sales/pos-printer';
import type { PosPrinter as PrismaPosPrinter } from '@prisma/generated/client.js';

export function posPrinterPrismaToDomain(raw: PrismaPosPrinter): PosPrinter {
  return PosPrinter.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      name: raw.name,
      type: raw.type,
      connection: raw.connection,
      ipAddress: raw.ipAddress ?? undefined,
      port: raw.port ?? undefined,
      deviceId: raw.deviceId ?? undefined,
      bluetoothAddress: raw.bluetoothAddress ?? undefined,
      paperWidth: raw.paperWidth as 80 | 58,
      encoding: raw.encoding,
      characterPerLine: raw.characterPerLine,
      isDefault: raw.isDefault,
      isActive: raw.isActive,
      status: raw.status,
      lastSeenAt: raw.lastSeenAt ?? undefined,
      agentId: raw.agentId ?? undefined,
      capabilities:
        (raw.capabilities as Record<string, unknown>) ?? undefined,
      osName: raw.osName ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}

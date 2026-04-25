import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import { PosFiscalDocumentType } from '@/entities/sales/value-objects/pos-fiscal-document-type';
import { PosFiscalEmissionMode } from '@/entities/sales/value-objects/pos-fiscal-emission-mode';
import type { PosFiscalConfig as PrismaPosFiscalConfig } from '@prisma/generated/client.js';

export function posFiscalConfigPrismaToDomain(
  raw: PrismaPosFiscalConfig,
): PosFiscalConfig {
  return PosFiscalConfig.create(
    {
      tenantId: raw.tenantId,
      enabledDocumentTypes: (raw.enabledDocumentTypes ?? []).map((t) =>
        PosFiscalDocumentType.create(t),
      ),
      defaultDocumentType: PosFiscalDocumentType.create(
        raw.defaultDocumentType,
      ),
      emissionMode: PosFiscalEmissionMode.create(raw.emissionMode),
      certificatePath: raw.certificatePath ?? null,
      nfceSeries: raw.nfceSeries ?? null,
      nfceNextNumber: raw.nfceNextNumber ?? null,
      satDeviceId: raw.satDeviceId ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}

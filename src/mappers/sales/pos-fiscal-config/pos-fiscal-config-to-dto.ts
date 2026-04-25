import type { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import type { PosFiscalDocumentTypeValue } from '@/entities/sales/value-objects/pos-fiscal-document-type';
import type { PosFiscalEmissionModeValue } from '@/entities/sales/value-objects/pos-fiscal-emission-mode';

export interface PosFiscalConfigDTO {
  id: string;
  tenantId: string;
  enabledDocumentTypes: PosFiscalDocumentTypeValue[];
  defaultDocumentType: PosFiscalDocumentTypeValue;
  emissionMode: PosFiscalEmissionModeValue;
  certificatePath: string | null;
  nfceSeries: number | null;
  nfceNextNumber: number | null;
  satDeviceId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export function posFiscalConfigToDTO(
  entity: PosFiscalConfig,
): PosFiscalConfigDTO {
  return {
    id: entity.id.toString(),
    tenantId: entity.tenantId,
    enabledDocumentTypes: entity.enabledDocumentTypes.map((t) => t.value),
    defaultDocumentType: entity.defaultDocumentType.value,
    emissionMode: entity.emissionMode.value,
    certificatePath: entity.certificatePath,
    nfceSeries: entity.nfceSeries,
    nfceNextNumber: entity.nfceNextNumber,
    satDeviceId: entity.satDeviceId,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt?.toISOString() ?? null,
  };
}

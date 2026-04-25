import type { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';

export interface PosTerminalZoneDTO {
  id: string;
  terminalId: string;
  zoneId: string;
  tier: 'PRIMARY' | 'SECONDARY';
  tenantId: string;
  createdAt: string;
  updatedAt: string | null;
}

export function posTerminalZoneToDTO(
  entity: PosTerminalZone,
): PosTerminalZoneDTO {
  return {
    id: entity.id.toString(),
    terminalId: entity.terminalId.toString(),
    zoneId: entity.zoneId.toString(),
    tier: entity.tier.value,
    tenantId: entity.tenantId,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt?.toISOString() ?? null,
  };
}

import type { Zone } from '@/entities/stock/zone';
import type { ZoneStructureProps } from '@/entities/stock/value-objects/zone-structure';
import type { ZoneLayoutProps } from '@/entities/stock/value-objects/zone-layout';

export interface ZoneStatsDTO {
  totalBins: number;
  occupiedBins: number;
  emptyBins: number;
  blockedBins: number;
  totalCapacity: number;
  occupancyPercentage: number;
}

export interface ZoneDTO {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  description: string | null;
  structure: ZoneStructureProps;
  layout: ZoneLayoutProps | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  binCount?: number;
  totalBins?: number;
  stats?: ZoneStatsDTO;
}

export function zoneToDTO(
  zone: Zone,
  options?: { binCount?: number; stats?: ZoneStatsDTO },
): ZoneDTO {
  return {
    id: zone.zoneId.toString(),
    warehouseId: zone.warehouseId.toString(),
    code: zone.code,
    name: zone.name,
    description: zone.description,
    structure: zone.structure.toJSON(),
    layout: zone.layout?.toJSON() ?? null,
    isActive: zone.isActive,
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
    binCount: options?.binCount,
    totalBins: zone.totalBins,
    stats: options?.stats,
  };
}

import type { Volume } from '@/entities/stock/volume';
import type { VolumeItem } from '@/entities/stock/volume-item';

export interface VolumeDTO {
  id: string;
  code: string;
  name: string | null;
  status: string;
  notes: string | null;
  destinationRef: string | null;
  salesOrderId: string | null;
  customerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  closedAt: Date | null;
  deliveredAt: Date | null;
  returnedAt: Date | null;
  closedBy: string | null;
  deliveredBy: string | null;
  deletedAt: Date | null;
  itemCount?: number;
}

export interface VolumeItemDTO {
  id: string;
  volumeId: string;
  itemId: string;
  addedAt: Date;
  addedBy: string;
}

export function volumeToDTO(volume: Volume): VolumeDTO {
  return {
    id: volume.id.toString(),
    code: volume.code,
    name: volume.name ?? null,
    status: volume.status,
    notes: volume.notes ?? null,
    destinationRef: volume.destinationRef ?? null,
    salesOrderId: volume.salesOrderId ?? null,
    customerId: volume.customerId ?? null,
    createdAt: volume.createdAt,
    updatedAt: volume.updatedAt,
    createdBy: volume.createdBy,
    closedAt: volume.closedAt ?? null,
    deliveredAt: volume.deliveredAt ?? null,
    returnedAt: volume.returnedAt ?? null,
    closedBy: volume.closedBy ?? null,
    deliveredBy: volume.deliveredBy ?? null,
    deletedAt: volume.deletedAt ?? null,
  };
}

export function volumeItemToDTO(volumeItem: VolumeItem): VolumeItemDTO {
  return {
    id: volumeItem.id.toString(),
    volumeId: volumeItem.volumeId,
    itemId: volumeItem.itemId,
    addedAt: volumeItem.addedAt,
    addedBy: volumeItem.addedBy,
  };
}

/**
 * @deprecated Use volumeToDTO() function directly instead.
 * Kept for backward compatibility.
 */
export class VolumeMapper {
  static toDTO(volume: Volume): VolumeDTO {
    return volumeToDTO(volume);
  }
}

/**
 * @deprecated Use volumeItemToDTO() function directly instead.
 * Kept for backward compatibility.
 */
export class VolumeItemMapper {
  static toDTO(volumeItem: VolumeItem): VolumeItemDTO {
    return volumeItemToDTO(volumeItem);
  }
}

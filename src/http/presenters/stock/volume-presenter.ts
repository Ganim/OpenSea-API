import {
  getVolumeStatusLabel,
  type VolumeStatus,
} from '@/entities/stock/value-objects/volume-status';
import type { VolumeDTO, VolumeItemDTO } from '@/mappers/stock/volume.mapper';

export interface VolumePresenter {
  id: string;
  code: string;
  name: string | null;
  status: string;
  statusLabel: string;
  notes: string | null;
  destinationRef: string | null;
  salesOrderId: string | null;
  customerId: string | null;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  closedAt: string | null;
  deliveredAt: string | null;
  returnedAt: string | null;
  closedBy: string | null;
  deliveredBy: string | null;
}

export interface VolumeItemPresenter {
  id: string;
  volumeId: string;
  itemId: string;
  addedAt: string;
  addedBy: string;
}

export interface RomaneioPresenter {
  volumeId: string;
  volumeCode: string;
  totalItems: number;
  items: VolumeItemPresenter[];
  generatedAt: string;
}

export class VolumeHttpPresenter {
  static toHTTP(volume: VolumeDTO): VolumePresenter {
    return {
      id: volume.id,
      code: volume.code,
      name: volume.name,
      status: volume.status,
      statusLabel: getVolumeStatusLabel(volume.status as VolumeStatus),
      notes: volume.notes,
      destinationRef: volume.destinationRef,
      salesOrderId: volume.salesOrderId,
      customerId: volume.customerId,
      itemCount: volume.itemCount,
      createdAt: volume.createdAt.toISOString(),
      updatedAt: volume.updatedAt.toISOString(),
      createdBy: volume.createdBy,
      closedAt: volume.closedAt?.toISOString() ?? null,
      deliveredAt: volume.deliveredAt?.toISOString() ?? null,
      returnedAt: volume.returnedAt?.toISOString() ?? null,
      closedBy: volume.closedBy,
      deliveredBy: volume.deliveredBy,
    };
  }

  static toHTTPList(volumes: VolumeDTO[]): VolumePresenter[] {
    return volumes.map((volume) => this.toHTTP(volume));
  }
}

export class VolumeItemHttpPresenter {
  static toHTTP(item: VolumeItemDTO): VolumeItemPresenter {
    return {
      id: item.id,
      volumeId: item.volumeId,
      itemId: item.itemId,
      addedAt: item.addedAt.toISOString(),
      addedBy: item.addedBy,
    };
  }

  static toHTTPList(items: VolumeItemDTO[]): VolumeItemPresenter[] {
    return items.map((item) => this.toHTTP(item));
  }
}

export class RomaneioHttpPresenter {
  static toHTTP(romaneio: {
    volumeId: string;
    volumeCode: string;
    totalItems: number;
    items: VolumeItemDTO[];
    generatedAt: Date;
  }): RomaneioPresenter {
    return {
      volumeId: romaneio.volumeId,
      volumeCode: romaneio.volumeCode,
      totalItems: romaneio.totalItems,
      items: VolumeItemHttpPresenter.toHTTPList(romaneio.items),
      generatedAt: romaneio.generatedAt.toISOString(),
    };
  }
}

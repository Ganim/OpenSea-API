import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Volume } from '@/entities/stock/volume';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { VolumeItem } from '@/entities/stock/volume-item';
import type {
  Prisma,
  Volume as PrismaVolume,
  VolumeItem as PrismaVolumeItem,
} from '@prisma/generated/client.js';

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

export class VolumeMapper {
  static toPersistence(volume: Volume): Prisma.VolumeUncheckedCreateInput {
    return {
      id: volume.id.toString(),
      tenantId: volume.tenantId.toString(),
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

  static toDomain(raw: PrismaVolume): Volume {
    return Volume.create(
      {
        tenantId: new EntityID(raw.tenantId),
        code: raw.code,
        name: raw.name ?? undefined,
        status: raw.status as unknown as VolumeStatus,
        notes: raw.notes ?? undefined,
        destinationRef: raw.destinationRef ?? undefined,
        salesOrderId: raw.salesOrderId ?? undefined,
        customerId: raw.customerId ?? undefined,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        createdBy: raw.createdBy,
        closedAt: raw.closedAt ?? undefined,
        deliveredAt: raw.deliveredAt ?? undefined,
        returnedAt: raw.returnedAt ?? undefined,
        closedBy: raw.closedBy ?? undefined,
        deliveredBy: raw.deliveredBy ?? undefined,
        deletedAt: raw.deletedAt ?? undefined,
      },
      new EntityID(raw.id),
    );
  }

  static toDTO(volume: Volume): VolumeDTO {
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
}

export class VolumeItemMapper {
  static toPersistence(
    volumeItem: VolumeItem,
  ): Prisma.VolumeItemUncheckedCreateInput {
    return {
      id: volumeItem.id.toString(),
      volumeId: volumeItem.volumeId,
      itemId: volumeItem.itemId,
      addedAt: volumeItem.addedAt,
      addedBy: volumeItem.addedBy,
    };
  }

  static toDomain(raw: PrismaVolumeItem): VolumeItem {
    return VolumeItem.create(
      {
        volumeId: raw.volumeId,
        itemId: raw.itemId,
        addedAt: raw.addedAt,
        addedBy: raw.addedBy,
      },
      new EntityID(raw.id),
    );
  }

  static toDTO(volumeItem: VolumeItem): VolumeItemDTO {
    return {
      id: volumeItem.id.toString(),
      volumeId: volumeItem.volumeId,
      itemId: volumeItem.itemId,
      addedAt: volumeItem.addedAt,
      addedBy: volumeItem.addedBy,
    };
  }
}

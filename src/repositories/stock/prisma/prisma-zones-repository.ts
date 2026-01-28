import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import {
  ZoneLayout,
  type ZoneLayoutProps,
} from '@/entities/stock/value-objects/zone-layout';
import {
  ZoneStructure,
  type ZoneStructureProps,
} from '@/entities/stock/value-objects/zone-structure';
import { Zone } from '@/entities/stock/zone';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/generated/client.js';
import type {
  CreateZoneSchema,
  UpdateZoneLayoutSchema,
  UpdateZoneSchema,
  UpdateZoneStructureSchema,
  ZonesRepository,
} from '../zones-repository';

function mapToZone(zoneData: {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  description: string | null;
  structure: Prisma.JsonValue;
  layout: Prisma.JsonValue | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Zone {
  const structureJson = zoneData.structure as unknown as ZoneStructureProps;
  const layoutJson = zoneData.layout as unknown as ZoneLayoutProps | null;

  return Zone.create(
    {
      warehouseId: new EntityID(zoneData.warehouseId),
      code: zoneData.code,
      name: zoneData.name,
      description: zoneData.description,
      structure: ZoneStructure.fromJSON(structureJson),
      layout: layoutJson ? ZoneLayout.fromJSON(layoutJson) : null,
      isActive: zoneData.isActive,
      createdAt: zoneData.createdAt,
      updatedAt: zoneData.updatedAt,
      deletedAt: zoneData.deletedAt,
    },
    new EntityID(zoneData.id),
  );
}

export class PrismaZonesRepository implements ZonesRepository {
  async create(data: CreateZoneSchema): Promise<Zone> {
    const defaultStructure = ZoneStructure.empty().toJSON();

    const zoneData = await prisma.zone.create({
      data: {
        warehouseId: data.warehouseId.toString(),
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description ?? null,
        structure: (data.structure ??
          defaultStructure) as unknown as Prisma.InputJsonValue,
        layout: data.layout
          ? (data.layout as unknown as Prisma.InputJsonValue)
          : undefined,
        isActive: data.isActive ?? true,
      },
    });

    return mapToZone(zoneData);
  }

  async findById(id: UniqueEntityID): Promise<Zone | null> {
    const zoneData = await prisma.zone.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!zoneData) {
      return null;
    }

    return mapToZone(zoneData);
  }

  async findByCode(
    warehouseId: UniqueEntityID,
    code: string,
  ): Promise<Zone | null> {
    const zoneData = await prisma.zone.findFirst({
      where: {
        warehouseId: warehouseId.toString(),
        code: {
          equals: code.toUpperCase(),
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    if (!zoneData) {
      return null;
    }

    return mapToZone(zoneData);
  }

  async findMany(): Promise<Zone[]> {
    const zones = await prisma.zone.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ warehouseId: 'asc' }, { name: 'asc' }],
    });

    return zones.map(mapToZone);
  }

  async findManyByWarehouse(warehouseId: UniqueEntityID): Promise<Zone[]> {
    const zones = await prisma.zone.findMany({
      where: {
        warehouseId: warehouseId.toString(),
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return zones.map(mapToZone);
  }

  async findManyActive(): Promise<Zone[]> {
    const zones = await prisma.zone.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ warehouseId: 'asc' }, { name: 'asc' }],
    });

    return zones.map(mapToZone);
  }

  async findManyActiveByWarehouse(
    warehouseId: UniqueEntityID,
  ): Promise<Zone[]> {
    const zones = await prisma.zone.findMany({
      where: {
        warehouseId: warehouseId.toString(),
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return zones.map(mapToZone);
  }

  async update(data: UpdateZoneSchema): Promise<Zone | null> {
    const updateData: {
      code?: string;
      name?: string;
      description?: string | null;
      isActive?: boolean;
    } = {};

    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const zoneData = await prisma.zone.update({
      where: {
        id: data.id.toString(),
      },
      data: updateData,
    });

    return mapToZone(zoneData);
  }

  async updateStructure(data: UpdateZoneStructureSchema): Promise<Zone | null> {
    const zoneData = await prisma.zone.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        structure: data.structure as unknown as Prisma.InputJsonValue,
      },
    });

    return mapToZone(zoneData);
  }

  async updateLayout(data: UpdateZoneLayoutSchema): Promise<Zone | null> {
    const zoneData = await prisma.zone.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        layout: data.layout
          ? (data.layout as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    return mapToZone(zoneData);
  }

  async save(zone: Zone): Promise<void> {
    await prisma.zone.update({
      where: {
        id: zone.zoneId.toString(),
      },
      data: {
        code: zone.code,
        name: zone.name,
        description: zone.description,
        structure: zone.structure.toJSON() as unknown as Prisma.InputJsonValue,
        layout: zone.layout
          ? (zone.layout.toJSON() as unknown as Prisma.InputJsonValue)
          : undefined,
        isActive: zone.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.zone.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async countBins(zoneId: UniqueEntityID): Promise<number> {
    return prisma.bin.count({
      where: {
        zoneId: zoneId.toString(),
        deletedAt: null,
      },
    });
  }
}

import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Location } from '@/entities/stock/location';
import { LocationType } from '@/entities/stock/value-objects/location-type';
import { prisma } from '@/lib/prisma';
import type { LocationType as PrismaLocationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type {
    CreateLocationSchema,
    LocationsRepository,
    UpdateLocationSchema,
} from '../locations-repository';

export class PrismaLocationsRepository implements LocationsRepository {
  async create(data: CreateLocationSchema): Promise<Location> {
    const locationData = await prisma.location.create({
      data: {
        code: data.code,
        description: data.description,
        locationType: data.locationType?.value as
          | PrismaLocationType
          | undefined,
        parentId: data.parentId?.toString(),
        capacity: data.capacity ? new Decimal(data.capacity) : undefined,
        currentOccupancy: data.currentOccupancy
          ? new Decimal(data.currentOccupancy)
          : new Decimal(0),
        isActive: data.isActive ?? true,
      },
    });

    return Location.create(
      {
        code: locationData.code,
        description: locationData.description ?? undefined,
        locationType: locationData.locationType
          ? LocationType.create(locationData.locationType)
          : undefined,
        parentId: locationData.parentId
          ? new EntityID(locationData.parentId)
          : undefined,
        capacity: locationData.capacity?.toNumber(),
        currentOccupancy: locationData.currentOccupancy?.toNumber() ?? 0,
        isActive: locationData.isActive,
        createdAt: locationData.createdAt,
        updatedAt: locationData.updatedAt,
        deletedAt: locationData.deletedAt ?? undefined,
      },
      new EntityID(locationData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<Location | null> {
    const locationData = await prisma.location.findFirst({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!locationData) return null;

    return Location.create(
      {
        code: locationData.code,
        description: locationData.description ?? undefined,
        locationType: locationData.locationType
          ? LocationType.create(locationData.locationType)
          : undefined,
        parentId: locationData.parentId
          ? new EntityID(locationData.parentId)
          : undefined,
        capacity: locationData.capacity?.toNumber(),
        currentOccupancy: locationData.currentOccupancy?.toNumber() ?? 0,
        isActive: locationData.isActive,
        createdAt: locationData.createdAt,
        updatedAt: locationData.updatedAt,
        deletedAt: locationData.deletedAt ?? undefined,
      },
      new EntityID(locationData.id),
    );
  }

  async findByCode(code: string): Promise<Location | null> {
    const locationData = await prisma.location.findFirst({
      where: {
        code,
        deletedAt: null,
      },
    });

    if (!locationData) return null;

    return Location.create(
      {
        code: locationData.code,
        description: locationData.description ?? undefined,
        locationType: locationData.locationType
          ? LocationType.create(locationData.locationType)
          : undefined,
        parentId: locationData.parentId
          ? new EntityID(locationData.parentId)
          : undefined,
        capacity: locationData.capacity?.toNumber(),
        currentOccupancy: locationData.currentOccupancy?.toNumber() ?? 0,
        isActive: locationData.isActive,
        createdAt: locationData.createdAt,
        updatedAt: locationData.updatedAt,
        deletedAt: locationData.deletedAt ?? undefined,
      },
      new EntityID(locationData.id),
    );
  }

  async findManyByType(locationType: LocationType): Promise<Location[]> {
    const locations = await prisma.location.findMany({
      where: {
        locationType: locationType.value as PrismaLocationType,
        deletedAt: null,
      },
    });

    return locations.map((locationData) =>
      Location.create(
        {
          code: locationData.code,
          description: locationData.description ?? undefined,
          locationType: locationData.locationType
            ? LocationType.create(locationData.locationType)
            : undefined,
          parentId: locationData.parentId
            ? new EntityID(locationData.parentId)
            : undefined,
          capacity: locationData.capacity?.toNumber(),
          currentOccupancy: locationData.currentOccupancy?.toNumber() ?? 0,
          isActive: locationData.isActive,
          createdAt: locationData.createdAt,
          updatedAt: locationData.updatedAt,
          deletedAt: locationData.deletedAt ?? undefined,
        },
        new EntityID(locationData.id),
      ),
    );
  }

  async findManyByParent(parentId: UniqueEntityID): Promise<Location[]> {
    const locations = await prisma.location.findMany({
      where: {
        parentId: parentId.toString(),
        deletedAt: null,
      },
    });

    return locations.map((locationData) =>
      Location.create(
        {
          code: locationData.code,
          description: locationData.description ?? undefined,
          locationType: locationData.locationType
            ? LocationType.create(locationData.locationType)
            : undefined,
          parentId: locationData.parentId
            ? new EntityID(locationData.parentId)
            : undefined,
          capacity: locationData.capacity?.toNumber(),
          currentOccupancy: locationData.currentOccupancy?.toNumber() ?? 0,
          isActive: locationData.isActive,
          createdAt: locationData.createdAt,
          updatedAt: locationData.updatedAt,
          deletedAt: locationData.deletedAt ?? undefined,
        },
        new EntityID(locationData.id),
      ),
    );
  }

  async findManyActive(): Promise<Location[]> {
    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    return locations.map((locationData) =>
      Location.create(
        {
          code: locationData.code,
          description: locationData.description ?? undefined,
          locationType: locationData.locationType
            ? LocationType.create(locationData.locationType)
            : undefined,
          parentId: locationData.parentId
            ? new EntityID(locationData.parentId)
            : undefined,
          capacity: locationData.capacity?.toNumber(),
          currentOccupancy: locationData.currentOccupancy?.toNumber() ?? 0,
          isActive: locationData.isActive,
          createdAt: locationData.createdAt,
          updatedAt: locationData.updatedAt,
          deletedAt: locationData.deletedAt ?? undefined,
        },
        new EntityID(locationData.id),
      ),
    );
  }

  async findManyNearCapacity(threshold: number): Promise<Location[]> {
    const locations = await prisma.location.findMany({
      where: {
        deletedAt: null,
        capacity: {
          not: null,
        },
      },
    });

    // Filter in memory for occupancy percentage calculation
    return locations
      .filter((locationData) => {
        if (
          !locationData.capacity ||
          !locationData.currentOccupancy ||
          locationData.capacity.toNumber() === 0
        ) {
          return false;
        }
        const occupancyPercentage =
          (locationData.currentOccupancy.toNumber() /
            locationData.capacity.toNumber()) *
          100;
        return occupancyPercentage >= threshold;
      })
      .map((locationData) =>
        Location.create(
          {
            code: locationData.code,
            description: locationData.description ?? undefined,
            locationType: locationData.locationType
              ? LocationType.create(locationData.locationType)
              : undefined,
            parentId: locationData.parentId
              ? new EntityID(locationData.parentId)
              : undefined,
            capacity: locationData.capacity?.toNumber(),
            currentOccupancy: locationData.currentOccupancy?.toNumber() ?? 0,
            isActive: locationData.isActive,
            createdAt: locationData.createdAt,
            updatedAt: locationData.updatedAt,
            deletedAt: locationData.deletedAt ?? undefined,
          },
          new EntityID(locationData.id),
        ),
      );
  }

  async update(data: UpdateLocationSchema): Promise<Location | null> {
    const locationData = await prisma.location.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        code: data.code,
        description: data.description,
        locationType: data.locationType?.value as
          | PrismaLocationType
          | undefined,
        parentId: data.parentId?.toString(),
        capacity: data.capacity ? new Decimal(data.capacity) : undefined,
        currentOccupancy: data.currentOccupancy
          ? new Decimal(data.currentOccupancy)
          : undefined,
        isActive: data.isActive,
      },
    });

    return Location.create(
      {
        code: locationData.code,
        description: locationData.description ?? undefined,
        locationType: locationData.locationType
          ? LocationType.create(locationData.locationType)
          : undefined,
        parentId: locationData.parentId
          ? new EntityID(locationData.parentId)
          : undefined,
        capacity: locationData.capacity?.toNumber(),
        currentOccupancy: locationData.currentOccupancy?.toNumber() ?? 0,
        isActive: locationData.isActive,
        createdAt: locationData.createdAt,
        updatedAt: locationData.updatedAt,
        deletedAt: locationData.deletedAt ?? undefined,
      },
      new EntityID(locationData.id),
    );
  }

  async save(location: Location): Promise<void> {
    await prisma.location.update({
      where: {
        id: location.id.toString(),
      },
      data: {
        code: location.code,
        description: location.description,
        locationType: location.locationType?.value as
          | PrismaLocationType
          | undefined,
        parentId: location.parentId?.toString(),
        capacity: location.capacity ? new Decimal(location.capacity) : null,
        currentOccupancy: new Decimal(location.currentOccupancy),
        isActive: location.isActive,
        updatedAt: location.updatedAt,
        deletedAt: location.deletedAt,
      },
    });
  }

  async countSubLocations(parentId: UniqueEntityID): Promise<number> {
    const count = await prisma.location.count({
      where: {
        parentId: parentId.toString(),
        deletedAt: null,
      },
    });

    return count;
  }

  async countDirectItems(locationId: UniqueEntityID): Promise<number> {
    const count = await prisma.item.aggregate({
      where: {
        locationId: locationId.toString(),
        deletedAt: null,
        currentQuantity: {
          gt: 0,
        },
      },
      _sum: {
        currentQuantity: true,
      },
    });

    return count._sum.currentQuantity?.toNumber() ?? 0;
  }

  async countTotalItems(locationId: UniqueEntityID): Promise<number> {
    // Get all sub-locations recursively
    const subLocations = await this.getAllSubLocationIds(locationId);

    const count = await prisma.item.aggregate({
      where: {
        locationId: {
          in: [locationId.toString(), ...subLocations],
        },
        deletedAt: null,
        currentQuantity: {
          gt: 0,
        },
      },
      _sum: {
        currentQuantity: true,
      },
    });

    return count._sum.currentQuantity?.toNumber() ?? 0;
  }

  private async getAllSubLocationIds(
    parentId: UniqueEntityID,
  ): Promise<string[]> {
    const subLocations = await prisma.location.findMany({
      where: {
        parentId: parentId.toString(),
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    const ids: string[] = [];

    for (const subLocation of subLocations) {
      ids.push(subLocation.id);
      // Recursively get sub-locations
      const nestedIds = await this.getAllSubLocationIds(
        new EntityID(subLocation.id),
      );
      ids.push(...nestedIds);
    }

    return ids;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.location.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

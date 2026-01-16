import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Bin } from '@/entities/stock/bin';
import { prisma } from '@/lib/prisma';
import type {
  BinsRepository,
  CreateBinSchema,
  CreateManyBinsSchema,
  UpdateBinSchema,
  BinSearchFilters,
  BinOccupancyData,
} from '../bins-repository';

function mapToBin(binData: {
  id: string;
  zoneId: string;
  address: string;
  aisle: number;
  shelf: number;
  position: string;
  capacity: number | null;
  currentOccupancy: number;
  isActive: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Bin {
  return Bin.create(
    {
      zoneId: new EntityID(binData.zoneId),
      address: binData.address,
      aisle: binData.aisle,
      shelf: binData.shelf,
      position: binData.position,
      capacity: binData.capacity,
      currentOccupancy: binData.currentOccupancy,
      isActive: binData.isActive,
      isBlocked: binData.isBlocked,
      blockReason: binData.blockReason,
      createdAt: binData.createdAt,
      updatedAt: binData.updatedAt,
      deletedAt: binData.deletedAt,
    },
    new EntityID(binData.id),
  );
}

export class PrismaBinsRepository implements BinsRepository {
  async create(data: CreateBinSchema): Promise<Bin> {
    const binData = await prisma.bin.create({
      data: {
        zoneId: data.zoneId.toString(),
        address: data.address,
        aisle: data.aisle,
        shelf: data.shelf,
        position: data.position,
        capacity: data.capacity ?? null,
        currentOccupancy: data.currentOccupancy ?? 0,
        isActive: data.isActive ?? true,
        isBlocked: data.isBlocked ?? false,
        blockReason: data.blockReason ?? null,
      },
    });

    return mapToBin(binData);
  }

  async createMany(data: CreateManyBinsSchema): Promise<number> {
    const result = await prisma.bin.createMany({
      data: data.bins.map((bin) => ({
        zoneId: data.zoneId.toString(),
        address: bin.address,
        aisle: bin.aisle,
        shelf: bin.shelf,
        position: bin.position,
        capacity: bin.capacity ?? null,
        currentOccupancy: 0,
        isActive: true,
        isBlocked: false,
      })),
    });

    return result.count;
  }

  async findById(id: UniqueEntityID): Promise<Bin | null> {
    const binData = await prisma.bin.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!binData) {
      return null;
    }

    return mapToBin(binData);
  }

  async findManyByIds(ids: UniqueEntityID[]): Promise<Bin[]> {
    if (ids.length === 0) return [];

    const bins = await prisma.bin.findMany({
      where: {
        id: {
          in: ids.map((id) => id.toString()),
        },
        deletedAt: null,
      },
      orderBy: [{ aisle: 'asc' }, { shelf: 'asc' }, { position: 'asc' }],
    });

    return bins.map(mapToBin);
  }

  async findByAddress(address: string): Promise<Bin | null> {
    const binData = await prisma.bin.findFirst({
      where: {
        address: {
          equals: address,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    if (!binData) {
      return null;
    }

    return mapToBin(binData);
  }

  async findMany(filters?: BinSearchFilters): Promise<Bin[]> {
    const where: {
      zoneId?: string;
      aisle?: number;
      shelf?: number;
      isActive?: boolean;
      isBlocked?: boolean;
      currentOccupancy?: { equals?: number; gt?: number; lt?: number };
      capacity?: { gt?: number };
      address?: { contains: string; mode: 'insensitive' };
      deletedAt: null;
    } = { deletedAt: null };

    if (filters?.zoneId) where.zoneId = filters.zoneId.toString();
    if (filters?.aisle !== undefined) where.aisle = filters.aisle;
    if (filters?.shelf !== undefined) where.shelf = filters.shelf;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.isBlocked !== undefined) where.isBlocked = filters.isBlocked;
    if (filters?.isEmpty) where.currentOccupancy = { equals: 0 };
    if (filters?.isFull) {
      // isFull requires comparing currentOccupancy >= capacity
      // This is handled in post-filter for now
    }
    if (filters?.addressPattern) {
      where.address = { contains: filters.addressPattern, mode: 'insensitive' };
    }

    const bins = await prisma.bin.findMany({
      where,
      orderBy: [{ aisle: 'asc' }, { shelf: 'asc' }, { position: 'asc' }],
    });

    let result = bins.map(mapToBin);

    // Post-filter for isFull if needed
    if (filters?.isFull) {
      result = result.filter((bin) => bin.isFull);
    }

    return result;
  }

  async findManyByZone(zoneId: UniqueEntityID): Promise<Bin[]> {
    const bins = await prisma.bin.findMany({
      where: {
        zoneId: zoneId.toString(),
        deletedAt: null,
      },
      orderBy: [{ aisle: 'asc' }, { shelf: 'asc' }, { position: 'asc' }],
    });

    return bins.map(mapToBin);
  }

  async findManyByAisle(zoneId: UniqueEntityID, aisle: number): Promise<Bin[]> {
    const bins = await prisma.bin.findMany({
      where: {
        zoneId: zoneId.toString(),
        aisle,
        deletedAt: null,
      },
      orderBy: [{ shelf: 'asc' }, { position: 'asc' }],
    });

    return bins.map(mapToBin);
  }

  async findManyAvailable(zoneId: UniqueEntityID): Promise<Bin[]> {
    const bins = await prisma.bin.findMany({
      where: {
        zoneId: zoneId.toString(),
        isActive: true,
        isBlocked: false,
        deletedAt: null,
      },
      orderBy: [{ aisle: 'asc' }, { shelf: 'asc' }, { position: 'asc' }],
    });

    // Filter out full bins
    return bins.map(mapToBin).filter((bin) => !bin.isFull);
  }

  async findManyBlocked(zoneId: UniqueEntityID): Promise<Bin[]> {
    const bins = await prisma.bin.findMany({
      where: {
        zoneId: zoneId.toString(),
        isBlocked: true,
        deletedAt: null,
      },
      orderBy: [{ aisle: 'asc' }, { shelf: 'asc' }, { position: 'asc' }],
    });

    return bins.map(mapToBin);
  }

  async search(query: string, limit = 20): Promise<Bin[]> {
    const bins = await prisma.bin.findMany({
      where: {
        address: {
          contains: query,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      orderBy: {
        address: 'asc',
      },
      take: limit,
    });

    return bins.map(mapToBin);
  }

  async update(data: UpdateBinSchema): Promise<Bin | null> {
    const updateData: {
      capacity?: number | null;
      isActive?: boolean;
      isBlocked?: boolean;
      blockReason?: string | null;
    } = {};

    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isBlocked !== undefined) updateData.isBlocked = data.isBlocked;
    if (data.blockReason !== undefined)
      updateData.blockReason = data.blockReason;

    const binData = await prisma.bin.update({
      where: {
        id: data.id.toString(),
      },
      data: updateData,
    });

    return mapToBin(binData);
  }

  async save(bin: Bin): Promise<void> {
    await prisma.bin.update({
      where: {
        id: bin.binId.toString(),
      },
      data: {
        capacity: bin.capacity,
        currentOccupancy: bin.currentOccupancy,
        isActive: bin.isActive,
        isBlocked: bin.isBlocked,
        blockReason: bin.blockReason,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.bin.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async deleteByZone(zoneId: UniqueEntityID): Promise<number> {
    const result = await prisma.bin.updateMany({
      where: {
        zoneId: zoneId.toString(),
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return result.count;
  }

  async getOccupancyMap(zoneId: UniqueEntityID): Promise<BinOccupancyData[]> {
    const bins = await prisma.bin.findMany({
      where: {
        zoneId: zoneId.toString(),
        deletedAt: null,
      },
      select: {
        id: true,
        address: true,
        aisle: true,
        shelf: true,
        position: true,
        capacity: true,
        currentOccupancy: true,
        isBlocked: true,
        _count: {
          select: {
            items: {
              where: {
                currentQuantity: { gt: 0 },
                status: 'AVAILABLE',
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: [{ aisle: 'asc' }, { shelf: 'asc' }, { position: 'asc' }],
    });

    return bins.map((bin) => ({
      binId: bin.id,
      address: bin.address,
      aisle: bin.aisle,
      shelf: bin.shelf,
      position: bin.position,
      capacity: bin.capacity,
      currentOccupancy: bin.currentOccupancy,
      isBlocked: bin.isBlocked,
      itemCount: bin._count.items,
    }));
  }

  async countByZone(zoneId: UniqueEntityID): Promise<number> {
    return prisma.bin.count({
      where: {
        zoneId: zoneId.toString(),
        deletedAt: null,
      },
    });
  }

  async countItemsInBin(binId: UniqueEntityID): Promise<number> {
    const result = await prisma.item.aggregate({
      where: {
        binId: binId.toString(),
        deletedAt: null,
      },
      _count: true,
    });

    return result._count;
  }
}

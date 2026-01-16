import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bin } from '@/entities/stock/bin';
import type {
  BinOccupancyData,
  BinSearchFilters,
  BinsRepository,
  CreateBinSchema,
  CreateManyBinsSchema,
  UpdateBinSchema,
} from '../bins-repository';

export class InMemoryBinsRepository implements BinsRepository {
  public bins: Bin[] = [];

  async create(data: CreateBinSchema): Promise<Bin> {
    const bin = Bin.create({
      zoneId: data.zoneId,
      address: data.address,
      aisle: data.aisle,
      shelf: data.shelf,
      position: data.position,
      capacity: data.capacity ?? null,
      currentOccupancy: data.currentOccupancy ?? 0,
      isActive: data.isActive ?? true,
      isBlocked: data.isBlocked ?? false,
      blockReason: data.blockReason ?? null,
    });

    this.bins.push(bin);
    return bin;
  }

  async createMany(data: CreateManyBinsSchema): Promise<number> {
    let count = 0;
    for (const binData of data.bins) {
      const bin = Bin.create({
        zoneId: data.zoneId,
        address: binData.address,
        aisle: binData.aisle,
        shelf: binData.shelf,
        position: binData.position,
        capacity: binData.capacity ?? null,
        currentOccupancy: 0,
        isActive: true,
        isBlocked: false,
        blockReason: null,
      });
      this.bins.push(bin);
      count++;
    }
    return count;
  }

  async findById(id: UniqueEntityID): Promise<Bin | null> {
    const bin = this.bins.find((b) => !b.deletedAt && b.binId.equals(id));
    return bin ?? null;
  }

  async findManyByIds(ids: UniqueEntityID[]): Promise<Bin[]> {
    return this.bins.filter(
      (b) => !b.deletedAt && ids.some((id) => b.binId.equals(id)),
    );
  }

  async findByAddress(address: string): Promise<Bin | null> {
    const bin = this.bins.find(
      (b) => !b.deletedAt && b.address.toLowerCase() === address.toLowerCase(),
    );
    return bin ?? null;
  }

  async findMany(filters?: BinSearchFilters): Promise<Bin[]> {
    let result = this.bins.filter((b) => !b.deletedAt);

    if (filters?.zoneId) {
      result = result.filter((b) => b.zoneId.equals(filters.zoneId!));
    }
    if (filters?.aisle !== undefined) {
      result = result.filter((b) => b.aisle === filters.aisle);
    }
    if (filters?.shelf !== undefined) {
      result = result.filter((b) => b.shelf === filters.shelf);
    }
    if (filters?.isActive !== undefined) {
      result = result.filter((b) => b.isActive === filters.isActive);
    }
    if (filters?.isBlocked !== undefined) {
      result = result.filter((b) => b.isBlocked === filters.isBlocked);
    }
    if (filters?.isEmpty) {
      result = result.filter((b) => b.isEmpty);
    }
    if (filters?.isFull) {
      result = result.filter((b) => b.isFull);
    }
    if (filters?.addressPattern) {
      result = result.filter((b) =>
        b.address.toLowerCase().includes(filters.addressPattern!.toLowerCase()),
      );
    }

    return result;
  }

  async findManyByZone(zoneId: UniqueEntityID): Promise<Bin[]> {
    return this.bins.filter((b) => !b.deletedAt && b.zoneId.equals(zoneId));
  }

  async findManyByAisle(zoneId: UniqueEntityID, aisle: number): Promise<Bin[]> {
    return this.bins.filter(
      (b) => !b.deletedAt && b.zoneId.equals(zoneId) && b.aisle === aisle,
    );
  }

  async findManyAvailable(zoneId: UniqueEntityID): Promise<Bin[]> {
    return this.bins.filter(
      (b) => !b.deletedAt && b.zoneId.equals(zoneId) && b.isAvailable,
    );
  }

  async findManyBlocked(zoneId: UniqueEntityID): Promise<Bin[]> {
    return this.bins.filter(
      (b) => !b.deletedAt && b.zoneId.equals(zoneId) && b.isBlocked,
    );
  }

  async search(query: string, limit = 20): Promise<Bin[]> {
    return this.bins
      .filter(
        (b) =>
          !b.deletedAt && b.address.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, limit);
  }

  async update(data: UpdateBinSchema): Promise<Bin | null> {
    const bin = await this.findById(data.id);
    if (!bin) return null;

    if (data.capacity !== undefined) bin.capacity = data.capacity;
    if (data.isActive !== undefined) bin.isActive = data.isActive;
    if (data.isBlocked !== undefined) bin.isBlocked = data.isBlocked;
    if (data.blockReason !== undefined) bin.blockReason = data.blockReason;

    return bin;
  }

  async save(bin: Bin): Promise<void> {
    const index = this.bins.findIndex((b) => b.binId.equals(bin.binId));
    if (index >= 0) {
      this.bins[index] = bin;
    } else {
      this.bins.push(bin);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const bin = await this.findById(id);
    if (bin) {
      bin.delete();
    }
  }

  async deleteByZone(zoneId: UniqueEntityID): Promise<number> {
    const binsToDelete = this.bins.filter(
      (b) => !b.deletedAt && b.zoneId.equals(zoneId),
    );
    for (const bin of binsToDelete) {
      bin.delete();
    }
    return binsToDelete.length;
  }

  async getOccupancyMap(zoneId: UniqueEntityID): Promise<BinOccupancyData[]> {
    return this.bins
      .filter((b) => !b.deletedAt && b.zoneId.equals(zoneId))
      .map((b) => ({
        binId: b.binId.toString(),
        address: b.address,
        aisle: b.aisle,
        shelf: b.shelf,
        position: b.position,
        capacity: b.capacity,
        currentOccupancy: b.currentOccupancy,
        isBlocked: b.isBlocked,
        itemCount: 0, // For testing, return 0 (could be integrated with items repository)
      }));
  }

  async countByZone(zoneId: UniqueEntityID): Promise<number> {
    return this.bins.filter((b) => !b.deletedAt && b.zoneId.equals(zoneId))
      .length;
  }

  async countItemsInBin(_binId: UniqueEntityID): Promise<number> {
    // For testing, return 0 (or could be integrated with items repository)
    return 0;
  }
}

import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
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
      tenantId: new EntityID(data.tenantId),
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
        tenantId: new EntityID(data.tenantId),
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

  async findById(id: UniqueEntityID, tenantId: string): Promise<Bin | null> {
    const bin = this.bins.find(
      (b) =>
        !b.deletedAt &&
        b.binId.equals(id) &&
        b.tenantId.toString() === tenantId,
    );
    return bin ?? null;
  }

  async findManyByIds(ids: UniqueEntityID[], tenantId: string): Promise<Bin[]> {
    return this.bins.filter(
      (b) =>
        !b.deletedAt &&
        ids.some((id) => b.binId.equals(id)) &&
        b.tenantId.toString() === tenantId,
    );
  }

  async findByAddress(address: string, tenantId: string): Promise<Bin | null> {
    const bin = this.bins.find(
      (b) =>
        !b.deletedAt &&
        b.address.toLowerCase() === address.toLowerCase() &&
        b.tenantId.toString() === tenantId,
    );
    return bin ?? null;
  }

  async findMany(tenantId: string, filters?: BinSearchFilters): Promise<Bin[]> {
    let result = this.bins.filter(
      (b) => !b.deletedAt && b.tenantId.toString() === tenantId,
    );

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

  async findManyByZone(
    zoneId: UniqueEntityID,
    tenantId: string,
  ): Promise<Bin[]> {
    return this.bins.filter(
      (b) =>
        !b.deletedAt &&
        b.zoneId.equals(zoneId) &&
        b.tenantId.toString() === tenantId,
    );
  }

  async findManyByAisle(
    zoneId: UniqueEntityID,
    aisle: number,
    tenantId: string,
  ): Promise<Bin[]> {
    return this.bins.filter(
      (b) =>
        !b.deletedAt &&
        b.zoneId.equals(zoneId) &&
        b.aisle === aisle &&
        b.tenantId.toString() === tenantId,
    );
  }

  async findManyAvailable(
    zoneId: UniqueEntityID,
    tenantId: string,
  ): Promise<Bin[]> {
    return this.bins.filter(
      (b) =>
        !b.deletedAt &&
        b.zoneId.equals(zoneId) &&
        b.isAvailable &&
        b.tenantId.toString() === tenantId,
    );
  }

  async findManyBlocked(
    zoneId: UniqueEntityID,
    tenantId: string,
  ): Promise<Bin[]> {
    return this.bins.filter(
      (b) =>
        !b.deletedAt &&
        b.zoneId.equals(zoneId) &&
        b.isBlocked &&
        b.tenantId.toString() === tenantId,
    );
  }

  async search(query: string, tenantId: string, limit = 20): Promise<Bin[]> {
    return this.bins
      .filter(
        (b) =>
          !b.deletedAt &&
          b.address.toLowerCase().includes(query.toLowerCase()) &&
          b.tenantId.toString() === tenantId,
      )
      .slice(0, limit);
  }

  async update(data: UpdateBinSchema): Promise<Bin | null> {
    const bin = this.bins.find((b) => !b.deletedAt && b.binId.equals(data.id));
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
    const bin = this.bins.find((b) => !b.deletedAt && b.binId.equals(id));
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

  async getOccupancyMap(
    zoneId: UniqueEntityID,
    _tenantId: string,
  ): Promise<BinOccupancyData[]> {
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

  async countByZone(
    zoneId: UniqueEntityID,
    _tenantId: string,
  ): Promise<number> {
    return this.bins.filter((b) => !b.deletedAt && b.zoneId.equals(zoneId))
      .length;
  }

  async countItemsInBin(_binId: UniqueEntityID): Promise<number> {
    // For testing, return 0 (or could be integrated with items repository)
    return 0;
  }
}

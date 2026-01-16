import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bin } from '@/entities/stock/bin';

export interface CreateBinSchema {
  zoneId: UniqueEntityID;
  address: string;
  aisle: number;
  shelf: number;
  position: string;
  capacity?: number;
  currentOccupancy?: number;
  isActive?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
}

export interface CreateManyBinsSchema {
  zoneId: UniqueEntityID;
  bins: Array<{
    address: string;
    aisle: number;
    shelf: number;
    position: string;
    capacity?: number;
  }>;
}

export interface UpdateBinSchema {
  id: UniqueEntityID;
  capacity?: number | null;
  isActive?: boolean;
  isBlocked?: boolean;
  blockReason?: string | null;
}

export interface BinSearchFilters {
  zoneId?: UniqueEntityID;
  aisle?: number;
  shelf?: number;
  isActive?: boolean;
  isBlocked?: boolean;
  isEmpty?: boolean;
  isFull?: boolean;
  addressPattern?: string;
}

export interface BinOccupancyData {
  binId: string;
  address: string;
  aisle: number;
  shelf: number;
  position: string;
  capacity: number | null;
  currentOccupancy: number;
  isBlocked: boolean;
  itemCount: number;
}

export interface BinsRepository {
  create(data: CreateBinSchema): Promise<Bin>;
  createMany(data: CreateManyBinsSchema): Promise<number>;
  findById(id: UniqueEntityID): Promise<Bin | null>;
  findManyByIds(ids: UniqueEntityID[]): Promise<Bin[]>;
  findByAddress(address: string): Promise<Bin | null>;
  findMany(filters?: BinSearchFilters): Promise<Bin[]>;
  findManyByZone(zoneId: UniqueEntityID): Promise<Bin[]>;
  findManyByAisle(zoneId: UniqueEntityID, aisle: number): Promise<Bin[]>;
  findManyAvailable(zoneId: UniqueEntityID): Promise<Bin[]>;
  findManyBlocked(zoneId: UniqueEntityID): Promise<Bin[]>;
  search(query: string, limit?: number): Promise<Bin[]>;
  update(data: UpdateBinSchema): Promise<Bin | null>;
  save(bin: Bin): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  deleteByZone(zoneId: UniqueEntityID): Promise<number>;
  getOccupancyMap(zoneId: UniqueEntityID): Promise<BinOccupancyData[]>;
  countByZone(zoneId: UniqueEntityID): Promise<number>;
  countItemsInBin(binId: UniqueEntityID): Promise<number>;
}

import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Location } from '@/entities/stock/location';
import { LocationType } from '@/entities/stock/value-objects/location-type';

export interface CreateLocationSchema {
  code: string;
  description?: string;
  locationType?: LocationType;
  parentId?: UniqueEntityID;
  capacity?: number;
  currentOccupancy?: number;
  isActive?: boolean;
}

export interface UpdateLocationSchema {
  id: UniqueEntityID;
  code?: string;
  description?: string;
  locationType?: LocationType;
  parentId?: UniqueEntityID;
  capacity?: number;
  currentOccupancy?: number;
  isActive?: boolean;
}

export interface LocationsRepository {
  create(data: CreateLocationSchema): Promise<Location>;
  findById(id: UniqueEntityID): Promise<Location | null>;
  findByCode(code: string): Promise<Location | null>;
  findManyByType(locationType: LocationType): Promise<Location[]>;
  findManyByParent(parentId: UniqueEntityID): Promise<Location[]>;
  findManyActive(): Promise<Location[]>;
  findManyNearCapacity(threshold: number): Promise<Location[]>;
  update(data: UpdateLocationSchema): Promise<Location | null>;
  save(location: Location): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}

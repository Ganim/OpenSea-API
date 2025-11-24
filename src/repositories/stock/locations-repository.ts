import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Location } from '@/entities/stock/location';
import { LocationType } from '@/entities/stock/value-objects/location-type';

export interface CreateLocationSchema {
  code: string;
  titulo: string;
  label?: string;
  type: LocationType;
  parentId?: UniqueEntityID;
  capacity?: number;
  currentOccupancy?: number;
  isActive?: boolean;
}

export interface UpdateLocationSchema {
  id: UniqueEntityID;
  code?: string;
  titulo?: string;
  label?: string;
  type?: LocationType;
  parentId?: UniqueEntityID;
  capacity?: number;
  currentOccupancy?: number;
  isActive?: boolean;
}

export interface LocationsRepository {
  create(data: CreateLocationSchema): Promise<Location>;
  findById(id: UniqueEntityID): Promise<Location | null>;
  findByCode(code: string): Promise<Location | null>;
  findManyByType(type: LocationType): Promise<Location[]>;
  findManyByParent(parentId: UniqueEntityID): Promise<Location[]>;
  findManyActive(filters?: { type?: LocationType }): Promise<Location[]>;
  findManyNearCapacity(threshold: number): Promise<Location[]>;
  countSubLocations(parentId: UniqueEntityID): Promise<number>;
  countDirectItems(locationId: UniqueEntityID): Promise<number>;
  countTotalItems(locationId: UniqueEntityID): Promise<number>;
  update(data: UpdateLocationSchema): Promise<Location | null>;
  save(location: Location): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}

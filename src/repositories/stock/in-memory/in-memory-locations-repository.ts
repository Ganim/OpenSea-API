import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Location } from '@/entities/stock/location';
import { LocationType } from '@/entities/stock/value-objects/location-type';
import type {
  CreateLocationSchema,
  LocationsRepository,
  UpdateLocationSchema,
} from '../locations-repository';

export class InMemoryLocationsRepository implements LocationsRepository {
  public items: Location[] = [];

  async create(data: CreateLocationSchema): Promise<Location> {
    const location = Location.create({
      code: data.code,
      description: data.description,
      locationType: data.locationType,
      parentId: data.parentId,
      capacity: data.capacity,
      currentOccupancy: data.currentOccupancy ?? 0,
      isActive: data.isActive ?? true,
    });

    this.items.push(location);
    return location;
  }

  async findById(id: UniqueEntityID): Promise<Location | null> {
    const location = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    return location ?? null;
  }

  async findByCode(code: string): Promise<Location | null> {
    const location = this.items.find(
      (item) => !item.deletedAt && item.code === code,
    );
    return location ?? null;
  }

  async findMany(): Promise<Location[]> {
    return this.items.filter((item) => !item.deletedAt);
  }

  async findManyByType(locationType: LocationType): Promise<Location[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt && item.locationType?.value === locationType.value,
    );
  }

  async findManyByParent(parentId: UniqueEntityID): Promise<Location[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.parentId?.equals(parentId),
    );
  }

  async findManyActive(): Promise<Location[]> {
    return this.items.filter((item) => !item.deletedAt && item.isActive);
  }

  async findManyNearCapacity(threshold: number): Promise<Location[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.capacity !== undefined &&
        item.capacity !== null &&
        item.currentOccupancy / item.capacity >= threshold / 100,
    );
  }

  async update(data: UpdateLocationSchema): Promise<Location | null> {
    const location = await this.findById(data.id);
    if (!location) return null;

    if (data.code !== undefined) location.code = data.code;
    if (data.locationType !== undefined)
      location.locationType = data.locationType;
    if (data.parentId !== undefined) location.parentId = data.parentId;
    if (data.description !== undefined) location.description = data.description;
    if (data.capacity !== undefined) location.capacity = data.capacity;
    if (data.currentOccupancy !== undefined)
      location.currentOccupancy = data.currentOccupancy;
    if (data.isActive !== undefined) location.isActive = data.isActive;

    return location;
  }

  async save(location: Location): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(location.id));
    if (index >= 0) {
      this.items[index] = location;
    } else {
      this.items.push(location);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const location = await this.findById(id);
    if (location) {
      location.delete();
    }
  }
}

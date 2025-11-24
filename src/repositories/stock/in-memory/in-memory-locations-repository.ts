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
      titulo: data.titulo,
      label: data.label,
      type: data.type,
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
        !item.deletedAt && item.type?.value === locationType.value,
    );
  }

  async findManyByParent(parentId: UniqueEntityID): Promise<Location[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.parentId?.equals(parentId),
    );
  }

  async findManyActive(filters?: { type?: LocationType }): Promise<Location[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.isActive &&
        (!filters?.type || item.type?.value === filters.type.value),
    );
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
    if (data.type !== undefined) location.type = data.type;
    if (data.parentId !== undefined) location.parentId = data.parentId;
    if (data.titulo !== undefined) location.titulo = data.titulo;
    if (data.label !== undefined) location.label = data.label;
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

  async countSubLocations(parentId: UniqueEntityID): Promise<number> {
    return this.items.filter(
      (item) => !item.deletedAt && item.parentId?.equals(parentId),
    ).length;
  }

  async countDirectItems(locationId: UniqueEntityID): Promise<number> {
    // In-memory repository doesn't have items, so return 0
    return 0;
  }

  async countTotalItems(locationId: UniqueEntityID): Promise<number> {
    // In-memory repository doesn't have items, so return 0
    return 0;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const location = await this.findById(id);
    if (location) {
      location.delete();
    }
  }
}

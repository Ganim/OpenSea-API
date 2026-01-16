import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Zone } from '@/entities/stock/zone';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { ZoneLayout } from '@/entities/stock/value-objects/zone-layout';
import type {
  CreateZoneSchema,
  UpdateZoneSchema,
  UpdateZoneStructureSchema,
  UpdateZoneLayoutSchema,
  ZonesRepository,
} from '../zones-repository';

export class InMemoryZonesRepository implements ZonesRepository {
  public zones: Zone[] = [];

  async create(data: CreateZoneSchema): Promise<Zone> {
    const zone = Zone.create({
      warehouseId: data.warehouseId,
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      structure: data.structure
        ? ZoneStructure.fromJSON(data.structure)
        : ZoneStructure.empty(),
      layout: data.layout ? ZoneLayout.create(data.layout) : null,
      isActive: data.isActive ?? true,
    });

    this.zones.push(zone);
    return zone;
  }

  async findById(id: UniqueEntityID): Promise<Zone | null> {
    const zone = this.zones.find((z) => !z.deletedAt && z.zoneId.equals(id));
    return zone ?? null;
  }

  async findByCode(
    warehouseId: UniqueEntityID,
    code: string,
  ): Promise<Zone | null> {
    const zone = this.zones.find(
      (z) =>
        !z.deletedAt &&
        z.warehouseId.equals(warehouseId) &&
        z.code.toLowerCase() === code.toLowerCase(),
    );
    return zone ?? null;
  }

  async findMany(): Promise<Zone[]> {
    return this.zones.filter((z) => !z.deletedAt);
  }

  async findManyByWarehouse(warehouseId: UniqueEntityID): Promise<Zone[]> {
    return this.zones.filter(
      (z) => !z.deletedAt && z.warehouseId.equals(warehouseId),
    );
  }

  async findManyActive(): Promise<Zone[]> {
    return this.zones.filter((z) => !z.deletedAt && z.isActive);
  }

  async findManyActiveByWarehouse(
    warehouseId: UniqueEntityID,
  ): Promise<Zone[]> {
    return this.zones.filter(
      (z) => !z.deletedAt && z.isActive && z.warehouseId.equals(warehouseId),
    );
  }

  async update(data: UpdateZoneSchema): Promise<Zone | null> {
    const zone = await this.findById(data.id);
    if (!zone) return null;

    if (data.code !== undefined) zone.code = data.code;
    if (data.name !== undefined) zone.name = data.name;
    if (data.description !== undefined) zone.description = data.description;
    if (data.isActive !== undefined) zone.isActive = data.isActive;

    return zone;
  }

  async updateStructure(data: UpdateZoneStructureSchema): Promise<Zone | null> {
    const zone = await this.findById(data.id);
    if (!zone) return null;

    zone.structure = ZoneStructure.create(data.structure);
    return zone;
  }

  async updateLayout(data: UpdateZoneLayoutSchema): Promise<Zone | null> {
    const zone = await this.findById(data.id);
    if (!zone) return null;

    zone.layout = data.layout ? ZoneLayout.create(data.layout) : null;
    return zone;
  }

  async save(zone: Zone): Promise<void> {
    const index = this.zones.findIndex((z) => z.zoneId.equals(zone.zoneId));
    if (index >= 0) {
      this.zones[index] = zone;
    } else {
      this.zones.push(zone);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const zone = await this.findById(id);
    if (zone) {
      zone.delete();
    }
  }

  async countBins(_zoneId: UniqueEntityID): Promise<number> {
    // For testing, return 0 (or could be integrated with bins repository)
    return 0;
  }
}

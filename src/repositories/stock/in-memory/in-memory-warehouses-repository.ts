import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Warehouse } from '@/entities/stock/warehouse';
import type {
  CreateWarehouseSchema,
  UpdateWarehouseSchema,
  WarehousesRepository,
} from '../warehouses-repository';

export class InMemoryWarehousesRepository implements WarehousesRepository {
  public warehouses: Warehouse[] = [];

  async create(data: CreateWarehouseSchema): Promise<Warehouse> {
    const warehouse = Warehouse.create({
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      address: data.address ?? null,
      isActive: data.isActive ?? true,
    });

    this.warehouses.push(warehouse);
    return warehouse;
  }

  async findById(id: UniqueEntityID): Promise<Warehouse | null> {
    const warehouse = this.warehouses.find(
      (w) => !w.deletedAt && w.warehouseId.equals(id),
    );
    return warehouse ?? null;
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    const warehouse = this.warehouses.find(
      (w) => !w.deletedAt && w.code.toLowerCase() === code.toLowerCase(),
    );
    return warehouse ?? null;
  }

  async findMany(): Promise<Warehouse[]> {
    return this.warehouses.filter((w) => !w.deletedAt);
  }

  async findManyActive(): Promise<Warehouse[]> {
    return this.warehouses.filter((w) => !w.deletedAt && w.isActive);
  }

  async update(data: UpdateWarehouseSchema): Promise<Warehouse | null> {
    const warehouse = await this.findById(data.id);
    if (!warehouse) return null;

    if (data.code !== undefined) warehouse.code = data.code;
    if (data.name !== undefined) warehouse.name = data.name;
    if (data.description !== undefined)
      warehouse.description = data.description;
    if (data.address !== undefined) warehouse.address = data.address;
    if (data.isActive !== undefined) warehouse.isActive = data.isActive;

    return warehouse;
  }

  async save(warehouse: Warehouse): Promise<void> {
    const index = this.warehouses.findIndex((w) =>
      w.warehouseId.equals(warehouse.warehouseId),
    );
    if (index >= 0) {
      this.warehouses[index] = warehouse;
    } else {
      this.warehouses.push(warehouse);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const warehouse = await this.findById(id);
    if (warehouse) {
      warehouse.delete();
    }
  }

  async countZones(_warehouseId: UniqueEntityID): Promise<number> {
    // For testing, return 0 (or could be integrated with zones repository)
    return 0;
  }
}

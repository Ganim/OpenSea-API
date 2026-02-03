import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Warehouse } from '@/entities/stock/warehouse';
import { prisma } from '@/lib/prisma';
import type {
  WarehousesRepository,
  CreateWarehouseSchema,
  UpdateWarehouseSchema,
} from '../warehouses-repository';

export class PrismaWarehousesRepository implements WarehousesRepository {
  async create(data: CreateWarehouseSchema): Promise<Warehouse> {
    const warehouseData = await prisma.warehouse.create({
      data: {
        tenantId: data.tenantId,
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description ?? null,
        address: data.address ?? null,
        isActive: data.isActive ?? true,
      },
    });

    return Warehouse.create(
      {
        tenantId: new EntityID(warehouseData.tenantId),
        code: warehouseData.code,
        name: warehouseData.name,
        description: warehouseData.description,
        address: warehouseData.address,
        isActive: warehouseData.isActive,
        createdAt: warehouseData.createdAt,
        updatedAt: warehouseData.updatedAt,
      },
      new EntityID(warehouseData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Warehouse | null> {
    const warehouseData = await prisma.warehouse.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!warehouseData) {
      return null;
    }

    return Warehouse.create(
      {
        tenantId: new EntityID(warehouseData.tenantId),
        code: warehouseData.code,
        name: warehouseData.name,
        description: warehouseData.description,
        address: warehouseData.address,
        isActive: warehouseData.isActive,
        createdAt: warehouseData.createdAt,
        updatedAt: warehouseData.updatedAt,
      },
      new EntityID(warehouseData.id),
    );
  }

  async findByCode(code: string, tenantId: string): Promise<Warehouse | null> {
    const warehouseData = await prisma.warehouse.findFirst({
      where: {
        code: {
          equals: code.toUpperCase(),
          mode: 'insensitive',
        },
        tenantId,
        deletedAt: null,
      },
    });

    if (!warehouseData) {
      return null;
    }

    return Warehouse.create(
      {
        tenantId: new EntityID(warehouseData.tenantId),
        code: warehouseData.code,
        name: warehouseData.name,
        description: warehouseData.description,
        address: warehouseData.address,
        isActive: warehouseData.isActive,
        createdAt: warehouseData.createdAt,
        updatedAt: warehouseData.updatedAt,
      },
      new EntityID(warehouseData.id),
    );
  }

  async findMany(tenantId: string): Promise<Warehouse[]> {
    const warehouses = await prisma.warehouse.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return warehouses.map((warehouseData) =>
      Warehouse.create(
        {
          tenantId: new EntityID(warehouseData.tenantId),
          code: warehouseData.code,
          name: warehouseData.name,
          description: warehouseData.description,
          address: warehouseData.address,
          isActive: warehouseData.isActive,
          createdAt: warehouseData.createdAt,
          updatedAt: warehouseData.updatedAt,
        },
        new EntityID(warehouseData.id),
      ),
    );
  }

  async findManyActive(tenantId: string): Promise<Warehouse[]> {
    const warehouses = await prisma.warehouse.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return warehouses.map((warehouseData) =>
      Warehouse.create(
        {
          tenantId: new EntityID(warehouseData.tenantId),
          code: warehouseData.code,
          name: warehouseData.name,
          description: warehouseData.description,
          address: warehouseData.address,
          isActive: warehouseData.isActive,
          createdAt: warehouseData.createdAt,
          updatedAt: warehouseData.updatedAt,
        },
        new EntityID(warehouseData.id),
      ),
    );
  }

  async update(data: UpdateWarehouseSchema): Promise<Warehouse | null> {
    const updateData: {
      code?: string;
      name?: string;
      description?: string | null;
      address?: string | null;
      isActive?: boolean;
    } = {};

    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const warehouseData = await prisma.warehouse.update({
      where: {
        id: data.id.toString(),
      },
      data: updateData,
    });

    return Warehouse.create(
      {
        tenantId: new EntityID(warehouseData.tenantId),
        code: warehouseData.code,
        name: warehouseData.name,
        description: warehouseData.description,
        address: warehouseData.address,
        isActive: warehouseData.isActive,
        createdAt: warehouseData.createdAt,
        updatedAt: warehouseData.updatedAt,
      },
      new EntityID(warehouseData.id),
    );
  }

  async save(warehouse: Warehouse): Promise<void> {
    await prisma.warehouse.update({
      where: {
        id: warehouse.warehouseId.toString(),
      },
      data: {
        code: warehouse.code,
        name: warehouse.name,
        description: warehouse.description,
        address: warehouse.address,
        isActive: warehouse.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.warehouse.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async countZones(warehouseId: UniqueEntityID): Promise<number> {
    return prisma.zone.count({
      where: {
        warehouseId: warehouseId.toString(),
        deletedAt: null,
      },
    });
  }
}

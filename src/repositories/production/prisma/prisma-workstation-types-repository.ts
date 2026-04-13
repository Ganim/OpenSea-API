import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionWorkstationType } from '@/entities/production/workstation-type';
import { prisma } from '@/lib/prisma';
import type {
  WorkstationTypesRepository,
  CreateWorkstationTypeSchema,
  UpdateWorkstationTypeSchema,
} from '../workstation-types-repository';

export class PrismaWorkstationTypesRepository
  implements WorkstationTypesRepository
{
  async create(
    data: CreateWorkstationTypeSchema,
  ): Promise<ProductionWorkstationType> {
    const raw = await prisma.productionWorkstationType.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description ?? null,
        icon: data.icon ?? null,
        color: data.color ?? null,
        isActive: data.isActive ?? true,
      },
    });

    return ProductionWorkstationType.create(
      {
        tenantId: new EntityID(raw.tenantId),
        name: raw.name,
        description: raw.description ?? null,
        icon: raw.icon ?? null,
        color: raw.color ?? null,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new EntityID(raw.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkstationType | null> {
    const raw = await prisma.productionWorkstationType.findUnique({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!raw) {
      return null;
    }

    return ProductionWorkstationType.create(
      {
        tenantId: new EntityID(raw.tenantId),
        name: raw.name,
        description: raw.description ?? null,
        icon: raw.icon ?? null,
        color: raw.color ?? null,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new EntityID(raw.id),
    );
  }

  async findMany(tenantId: string): Promise<ProductionWorkstationType[]> {
    const records = await prisma.productionWorkstationType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return records.map((raw) =>
      ProductionWorkstationType.create(
        {
          tenantId: new EntityID(raw.tenantId),
          name: raw.name,
          description: raw.description ?? null,
          icon: raw.icon ?? null,
          color: raw.color ?? null,
          isActive: raw.isActive,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        },
        new EntityID(raw.id),
      ),
    );
  }

  async update(
    data: UpdateWorkstationTypeSchema,
  ): Promise<ProductionWorkstationType | null> {
    const updateData: {
      name?: string;
      description?: string | null;
      icon?: string | null;
      color?: string | null;
      isActive?: boolean;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const raw = await prisma.productionWorkstationType.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return ProductionWorkstationType.create(
      {
        tenantId: new EntityID(raw.tenantId),
        name: raw.name,
        description: raw.description ?? null,
        icon: raw.icon ?? null,
        color: raw.color ?? null,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new EntityID(raw.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionWorkstationType.delete({
      where: { id: id.toString() },
    });
  }
}

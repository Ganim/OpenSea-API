import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionWorkCenter } from '@/entities/production/work-center';
import { prisma } from '@/lib/prisma';
import type {
  WorkCentersRepository,
  CreateWorkCenterSchema,
  UpdateWorkCenterSchema,
} from '../work-centers-repository';

export class PrismaWorkCentersRepository implements WorkCentersRepository {
  async create(data: CreateWorkCenterSchema): Promise<ProductionWorkCenter> {
    const raw = await prisma.productionWorkCenter.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
    });

    return ProductionWorkCenter.create(
      {
        tenantId: new EntityID(raw.tenantId),
        code: raw.code,
        name: raw.name,
        description: raw.description ?? null,
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
  ): Promise<ProductionWorkCenter | null> {
    const raw = await prisma.productionWorkCenter.findUnique({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!raw) {
      return null;
    }

    return ProductionWorkCenter.create(
      {
        tenantId: new EntityID(raw.tenantId),
        code: raw.code,
        name: raw.name,
        description: raw.description ?? null,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new EntityID(raw.id),
    );
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionWorkCenter | null> {
    const raw = await prisma.productionWorkCenter.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        tenantId,
      },
    });

    if (!raw) {
      return null;
    }

    return ProductionWorkCenter.create(
      {
        tenantId: new EntityID(raw.tenantId),
        code: raw.code,
        name: raw.name,
        description: raw.description ?? null,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new EntityID(raw.id),
    );
  }

  async findMany(tenantId: string): Promise<ProductionWorkCenter[]> {
    const records = await prisma.productionWorkCenter.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return records.map((raw) =>
      ProductionWorkCenter.create(
        {
          tenantId: new EntityID(raw.tenantId),
          code: raw.code,
          name: raw.name,
          description: raw.description ?? null,
          isActive: raw.isActive,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        },
        new EntityID(raw.id),
      ),
    );
  }

  async update(
    data: UpdateWorkCenterSchema,
  ): Promise<ProductionWorkCenter | null> {
    const updateData: {
      code?: string;
      name?: string;
      description?: string | null;
      isActive?: boolean;
    } = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const raw = await prisma.productionWorkCenter.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return ProductionWorkCenter.create(
      {
        tenantId: new EntityID(raw.tenantId),
        code: raw.code,
        name: raw.name,
        description: raw.description ?? null,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new EntityID(raw.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionWorkCenter.delete({
      where: { id: id.toString() },
    });
  }
}

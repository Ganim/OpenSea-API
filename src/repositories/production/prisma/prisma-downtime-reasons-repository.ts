import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionDowntimeReasonCategory } from '@/entities/production/downtime-reason';
import { ProductionDowntimeReason } from '@/entities/production/downtime-reason';
import { prisma } from '@/lib/prisma';
import type {
  DowntimeReasonsRepository,
  CreateDowntimeReasonSchema,
  UpdateDowntimeReasonSchema,
} from '../downtime-reasons-repository';

function toDomain(raw: {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
}): ProductionDowntimeReason {
  return ProductionDowntimeReason.create(
    {
      tenantId: new EntityID(raw.tenantId),
      code: raw.code,
      name: raw.name,
      category: raw.category as ProductionDowntimeReasonCategory,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaDowntimeReasonsRepository
  implements DowntimeReasonsRepository
{
  async create(
    data: CreateDowntimeReasonSchema,
  ): Promise<ProductionDowntimeReason> {
    const raw = await prisma.productionDowntimeReason.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        category: data.category,
        isActive: data.isActive ?? true,
      },
    });

    return toDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionDowntimeReason | null> {
    const raw = await prisma.productionDowntimeReason.findUnique({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionDowntimeReason | null> {
    const raw = await prisma.productionDowntimeReason.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        tenantId,
      },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findMany(tenantId: string): Promise<ProductionDowntimeReason[]> {
    const records = await prisma.productionDowntimeReason.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return records.map(toDomain);
  }

  async update(
    data: UpdateDowntimeReasonSchema,
  ): Promise<ProductionDowntimeReason | null> {
    const updateData: {
      code?: string;
      name?: string;
      category?: string;
      isActive?: boolean;
    } = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const raw = await prisma.productionDowntimeReason.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionDowntimeReason.delete({
      where: { id: id.toString() },
    });
  }
}

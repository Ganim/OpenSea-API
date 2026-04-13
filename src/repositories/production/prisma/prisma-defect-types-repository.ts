import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionDefectTypeSeverity } from '@/entities/production/defect-type';
import { ProductionDefectType } from '@/entities/production/defect-type';
import { prisma } from '@/lib/prisma';
import type {
  DefectTypesRepository,
  CreateDefectTypeSchema,
  UpdateDefectTypeSchema,
} from '../defect-types-repository';

function toDomain(raw: {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  severity: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ProductionDefectType {
  return ProductionDefectType.create(
    {
      tenantId: new EntityID(raw.tenantId),
      code: raw.code,
      name: raw.name,
      description: raw.description ?? null,
      severity: raw.severity as ProductionDefectTypeSeverity,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaDefectTypesRepository implements DefectTypesRepository {
  async create(data: CreateDefectTypeSchema): Promise<ProductionDefectType> {
    const raw = await prisma.productionDefectType.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        severity: data.severity,
        isActive: data.isActive ?? true,
      },
    });

    return toDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionDefectType | null> {
    const raw = await prisma.productionDefectType.findUnique({
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
  ): Promise<ProductionDefectType | null> {
    const raw = await prisma.productionDefectType.findFirst({
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

  async findMany(tenantId: string): Promise<ProductionDefectType[]> {
    const records = await prisma.productionDefectType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return records.map(toDomain);
  }

  async update(
    data: UpdateDefectTypeSchema,
  ): Promise<ProductionDefectType | null> {
    const updateData: {
      code?: string;
      name?: string;
      description?: string | null;
      severity?: string;
      isActive?: boolean;
    } = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const raw = await prisma.productionDefectType.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionDefectType.delete({
      where: { id: id.toString() },
    });
  }
}

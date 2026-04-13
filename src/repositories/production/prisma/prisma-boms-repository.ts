import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionBomStatus } from '@/entities/production/bill-of-materials';
import { ProductionBom } from '@/entities/production/bill-of-materials';
import { prisma } from '@/lib/prisma';
import type {
  BomsRepository,
  CreateBomSchema,
  UpdateBomSchema,
} from '../boms-repository';

function toDomain(raw: {
  id: string;
  tenantId: string;
  productId: string;
  version: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  validFrom: Date;
  validUntil: Date | null;
  status: string;
  baseQuantity: number;
  createdById: string;
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ProductionBom {
  return ProductionBom.create(
    {
      tenantId: new EntityID(raw.tenantId),
      productId: new EntityID(raw.productId),
      version: raw.version,
      name: raw.name,
      description: raw.description ?? null,
      isDefault: raw.isDefault,
      validFrom: raw.validFrom,
      validUntil: raw.validUntil ?? null,
      status: raw.status as ProductionBomStatus,
      baseQuantity: raw.baseQuantity,
      createdById: new EntityID(raw.createdById),
      approvedById: raw.approvedById
        ? new EntityID(raw.approvedById)
        : null,
      approvedAt: raw.approvedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaBomsRepository implements BomsRepository {
  async create(data: CreateBomSchema): Promise<ProductionBom> {
    const raw = await prisma.productionBom.create({
      data: {
        tenantId: data.tenantId,
        productId: data.productId,
        version: data.version,
        name: data.name,
        description: data.description ?? null,
        isDefault: data.isDefault ?? false,
        validFrom: data.validFrom,
        validUntil: data.validUntil ?? null,
        status: data.status ?? 'DRAFT',
        baseQuantity: data.baseQuantity,
        createdById: data.createdById,
        approvedById: data.approvedById ?? null,
        approvedAt: data.approvedAt ?? null,
      },
    });

    return toDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionBom | null> {
    const raw = await prisma.productionBom.findUnique({
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

  async findMany(tenantId: string): Promise<ProductionBom[]> {
    const records = await prisma.productionBom.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(toDomain);
  }

  async findByProductId(
    productId: string,
    tenantId: string,
  ): Promise<ProductionBom[]> {
    const records = await prisma.productionBom.findMany({
      where: {
        productId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(toDomain);
  }

  async findDefaultByProductId(
    productId: string,
    tenantId: string,
  ): Promise<ProductionBom | null> {
    const raw = await prisma.productionBom.findFirst({
      where: {
        productId,
        tenantId,
        isDefault: true,
        status: 'ACTIVE',
      },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async update(data: UpdateBomSchema): Promise<ProductionBom | null> {
    const updateData: {
      productId?: string;
      version?: string;
      name?: string;
      description?: string | null;
      isDefault?: boolean;
      validFrom?: Date;
      validUntil?: Date | null;
      status?: string;
      baseQuantity?: number;
      approvedById?: string | null;
      approvedAt?: Date | null;
    } = {};

    if (data.productId !== undefined) updateData.productId = data.productId;
    if (data.version !== undefined) updateData.version = data.version;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.validFrom !== undefined) updateData.validFrom = data.validFrom;
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.baseQuantity !== undefined)
      updateData.baseQuantity = data.baseQuantity;
    if (data.approvedById !== undefined)
      updateData.approvedById = data.approvedById;
    if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt;

    const raw = await prisma.productionBom.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionBom.delete({
      where: { id: id.toString() },
    });
  }
}

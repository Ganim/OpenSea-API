import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionBomItem } from '@/entities/production/bom-item';
import { prisma } from '@/lib/prisma';
import type {
  BomItemsRepository,
  CreateBomItemSchema,
  UpdateBomItemSchema,
} from '../bom-items-repository';

function toDomain(raw: {
  id: string;
  bomId: string;
  materialId: string;
  sequence: number;
  quantity: number;
  unit: string;
  wastagePercent: number;
  isOptional: boolean;
  substituteForId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProductionBomItem {
  return ProductionBomItem.create(
    {
      bomId: new EntityID(raw.bomId),
      materialId: new EntityID(raw.materialId),
      sequence: raw.sequence,
      quantity: Number(raw.quantity),
      unit: raw.unit,
      wastagePercent: Number(raw.wastagePercent),
      isOptional: raw.isOptional,
      substituteForId: raw.substituteForId
        ? new EntityID(raw.substituteForId)
        : null,
      notes: raw.notes ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaBomItemsRepository implements BomItemsRepository {
  async create(data: CreateBomItemSchema): Promise<ProductionBomItem> {
    const raw = await prisma.productionBomItem.create({
      data: {
        bomId: data.bomId,
        materialId: data.materialId,
        sequence: data.sequence,
        quantity: data.quantity,
        unit: data.unit,
        wastagePercent: data.wastagePercent ?? 0,
        isOptional: data.isOptional ?? false,
        substituteForId: data.substituteForId ?? null,
        notes: data.notes ?? null,
      },
    });

    return toDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<ProductionBomItem | null> {
    const raw = await prisma.productionBomItem.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByBomId(bomId: UniqueEntityID): Promise<ProductionBomItem[]> {
    const records = await prisma.productionBomItem.findMany({
      where: { bomId: bomId.toString() },
      orderBy: { sequence: 'asc' },
    });

    return records.map(toDomain);
  }

  async update(data: UpdateBomItemSchema): Promise<ProductionBomItem | null> {
    const updateData: {
      materialId?: string;
      sequence?: number;
      quantity?: number;
      unit?: string;
      wastagePercent?: number;
      isOptional?: boolean;
      substituteForId?: string | null;
      notes?: string | null;
    } = {};

    if (data.materialId !== undefined) updateData.materialId = data.materialId;
    if (data.sequence !== undefined) updateData.sequence = data.sequence;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.wastagePercent !== undefined)
      updateData.wastagePercent = data.wastagePercent;
    if (data.isOptional !== undefined) updateData.isOptional = data.isOptional;
    if (data.substituteForId !== undefined)
      updateData.substituteForId = data.substituteForId;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const raw = await prisma.productionBomItem.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionBomItem.delete({
      where: { id: id.toString() },
    });
  }

  async deleteByBomId(bomId: UniqueEntityID): Promise<void> {
    await prisma.productionBomItem.deleteMany({
      where: { bomId: bomId.toString() },
    });
  }
}

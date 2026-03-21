import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Combo } from '@/entities/sales/combo';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CombosRepository,
  CreateComboSchema,
  FindManyCombosParams,
  UpdateComboSchema,
} from '../combos-repository';

export class PrismaCombosRepository implements CombosRepository {
  async create(data: CreateComboSchema): Promise<Combo> {
    const record = await prisma.combo.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description ?? null,
        type: data.type as any,
        discountType: data.discountType as any,
        discountValue: data.discountValue,
        isActive: data.isActive ?? true,
        validFrom: data.startDate ?? null,
        validUntil: data.endDate ?? null,
        minItems: data.minItems ?? null,
        maxItems: data.maxItems ?? null,
      },
    });

    return Combo.create(
      {
        tenantId: new EntityID(record.tenantId),
        name: record.name,
        description: record.description ?? undefined,
        type: record.type as Combo['type'],
        discountType: record.discountType as Combo['discountType'],
        discountValue: Number(record.discountValue),
        isActive: record.isActive,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      new EntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Combo | null> {
    const record = await prisma.combo.findUnique({
      where: { id: id.toString(), tenantId, deletedAt: null },
      include: { items: true },
    });

    if (!record) return null;

    return Combo.create(
      {
        tenantId: new EntityID(record.tenantId),
        name: record.name,
        description: record.description ?? undefined,
        type: record.type as Combo['type'],
        discountType: record.discountType as Combo['discountType'],
        discountValue: Number(record.discountValue),
        isActive: record.isActive,
        items: record.items.map((i) => ({
          id: new EntityID(i.id),
          comboId: new EntityID(i.comboId),
          variantId: i.variantId ? new EntityID(i.variantId) : undefined,
          categoryId: i.categoryId ? new EntityID(i.categoryId) : undefined,
          quantity: Number(i.quantity),
          sortOrder: i.position,
          createdAt: i.createdAt,
        })),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      new EntityID(record.id),
    );
  }

  async findManyPaginated(
    params: FindManyCombosParams,
  ): Promise<PaginatedResult<Combo>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.type) where.type = params.type;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.combo.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc' },
      }),
      prisma.combo.count({ where }),
    ]);

    const data = records.map((r) =>
      Combo.create(
        {
          tenantId: new EntityID(r.tenantId),
          name: r.name,
          description: r.description ?? undefined,
          type: r.type as Combo['type'],
          discountType: r.discountType as Combo['discountType'],
          discountValue: Number(r.discountValue),
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        new EntityID(r.id),
      ),
    );

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async update(data: UpdateComboSchema): Promise<Combo | null> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const record = await prisma.combo.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return Combo.create(
      {
        tenantId: new EntityID(record.tenantId),
        name: record.name,
        description: record.description ?? undefined,
        type: record.type as Combo['type'],
        discountType: record.discountType as Combo['discountType'],
        discountValue: Number(record.discountValue),
        isActive: record.isActive,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      new EntityID(record.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.combo.update({
      where: { id: id.toString(), tenantId },
      data: { deletedAt: new Date() },
    });
  }
}

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PPEItem } from '@/entities/hr/ppe-item';
import { prisma } from '@/lib/prisma';
import { mapPPEItemPrismaToDomain } from '@/mappers/hr/ppe-item';
import type {
  PPEItemsRepository,
  CreatePPEItemSchema,
  FindPPEItemFilters,
  UpdatePPEItemSchema,
  AdjustPPEItemStockSchema,
} from '../ppe-items-repository';

export class PrismaPPEItemsRepository implements PPEItemsRepository {
  async create(data: CreatePPEItemSchema): Promise<PPEItem> {
    const record = await prisma.pPEItem.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        category: data.category,
        caNumber: data.caNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        expirationMonths: data.expirationMonths,
        minStock: data.minStock ?? 0,
        currentStock: data.currentStock ?? 0,
        isActive: data.isActive ?? true,
        notes: data.notes,
      },
    });

    return PPEItem.create(
      mapPPEItemPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PPEItem | null> {
    const record = await prisma.pPEItem.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!record) return null;

    return PPEItem.create(
      mapPPEItemPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindPPEItemFilters,
  ): Promise<{ ppeItems: PPEItem[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.lowStockOnly) {
      where.currentStock = { lte: prisma.pPEItem.fields?.minStock ?? 0 };
      // Use raw comparison for low stock
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { caNumber: { contains: filters.search, mode: 'insensitive' } },
        {
          manufacturer: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // For lowStockOnly, use a raw where clause
    const finalWhere = filters?.lowStockOnly
      ? {
          ...where,
          currentStock: undefined,
          AND: [
            {
              currentStock: {
                lte: prisma.$queryRaw`"min_stock"` as unknown as number,
              },
            },
          ],
        }
      : where;

    const [records, total] = await Promise.all([
      prisma.pPEItem.findMany({
        where: filters?.lowStockOnly ? where : finalWhere,
        orderBy: { name: 'asc' },
        skip,
        take: perPage,
      }),
      prisma.pPEItem.count({
        where: filters?.lowStockOnly ? where : finalWhere,
      }),
    ]);

    // Filter low stock items in memory if needed
    let mappedItems = records.map((record) =>
      PPEItem.create(
        mapPPEItemPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );

    if (filters?.lowStockOnly) {
      mappedItems = mappedItems.filter((item) => item.isLowStock());
    }

    return {
      ppeItems: mappedItems,
      total: filters?.lowStockOnly ? mappedItems.length : total,
    };
  }

  async update(data: UpdatePPEItemSchema): Promise<PPEItem | null> {
    const existing = await prisma.pPEItem.findFirst({
      where: { id: data.id.toString(), deletedAt: null },
    });

    if (!existing) return null;

    const record = await prisma.pPEItem.update({
      where: { id: data.id.toString() },
      data: {
        name: data.name,
        category: data.category,
        caNumber: data.caNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        expirationMonths: data.expirationMonths,
        minStock: data.minStock,
        isActive: data.isActive,
        notes: data.notes,
      },
    });

    return PPEItem.create(
      mapPPEItemPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async adjustStock(data: AdjustPPEItemStockSchema): Promise<PPEItem | null> {
    const existing = await prisma.pPEItem.findFirst({
      where: { id: data.id.toString(), deletedAt: null },
    });

    if (!existing) return null;

    const newStock = Math.max(0, existing.currentStock + data.adjustment);

    const record = await prisma.pPEItem.update({
      where: { id: data.id.toString() },
      data: { currentStock: newStock },
    });

    return PPEItem.create(
      mapPPEItemPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    await prisma.pPEItem.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}

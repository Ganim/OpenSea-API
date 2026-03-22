import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PriceTable } from '@/entities/sales/price-table';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CreatePriceTableSchema,
  FindManyPriceTablesParams,
  PriceTablesRepository,
  PriceTableRuleData,
  PriceTableWithRules,
  UpdatePriceTableSchema,
} from '../price-tables-repository';

function mapToDomain(data: Record<string, unknown>): PriceTable {
  return PriceTable.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      name: data.name as string,
      description: (data.description as string) ?? undefined,
      type: data.type as string,
      currency: data.currency as string,
      priceIncludesTax: data.priceIncludesTax as boolean,
      isDefault: data.isDefault as boolean,
      priority: data.priority as number,
      isActive: data.isActive as boolean,
      validFrom: (data.validFrom as Date) ?? undefined,
      validUntil: (data.validUntil as Date) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaPriceTablesRepository implements PriceTablesRepository {
  async create(data: CreatePriceTableSchema): Promise<PriceTable> {
    const result = await prisma.priceTable.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        type: (data.type as 'DEFAULT') ?? 'DEFAULT',
        currency: data.currency ?? 'BRL',
        priceIncludesTax: data.priceIncludesTax ?? true,
        isDefault: data.isDefault ?? false,
        priority: data.priority ?? 0,
        isActive: data.isActive ?? true,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
      },
    });

    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PriceTable | null> {
    const result = await prisma.priceTable.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!result) return null;
    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findByName(name: string, tenantId: string): Promise<PriceTable | null> {
    const result = await prisma.priceTable.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        tenantId,
        deletedAt: null,
      },
    });

    if (!result) return null;
    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findDefault(tenantId: string): Promise<PriceTable | null> {
    const result = await prisma.priceTable.findFirst({
      where: {
        tenantId,
        isDefault: true,
        deletedAt: null,
      },
    });

    if (!result) return null;
    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findManyPaginated(
    params: FindManyPriceTablesParams,
  ): Promise<PaginatedResult<PriceTable>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.type) {
      where.type = params.type;
    }
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const [results, total] = await Promise.all([
      prisma.priceTable.findMany({
        where: where as any,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
      }),
      prisma.priceTable.count({
        where: where as any,
      }),
    ]);

    return {
      data: results.map((r) =>
        mapToDomain(r as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findActiveWithRulesByTenant(
    tenantId: string,
  ): Promise<PriceTableWithRules[]> {
    const results = await prisma.priceTable.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        rules: true,
      },
      orderBy: { priority: 'desc' },
    });

    return results.map((r) => ({
      table: mapToDomain(r as unknown as Record<string, unknown>),
      rules: r.rules.map((rule) => ({
        id: rule.id,
        priceTableId: rule.priceTableId,
        tenantId: rule.tenantId,
        ruleType: rule.ruleType as PriceTableRuleData['ruleType'],
        operator: rule.operator as PriceTableRuleData['operator'],
        value: rule.value,
        createdAt: rule.createdAt,
      })),
    }));
  }

  async update(data: UpdatePriceTableSchema): Promise<PriceTable | null> {
    try {
      const updateData: Record<string, unknown> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.priceIncludesTax !== undefined)
        updateData.priceIncludesTax = data.priceIncludesTax;
      if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.validFrom !== undefined) updateData.validFrom = data.validFrom;
      if (data.validUntil !== undefined)
        updateData.validUntil = data.validUntil;

      const result = await prisma.priceTable.update({
        where: { id: data.id.toString() },
        data: updateData,
      });

      return mapToDomain(result as unknown as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.priceTable.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}

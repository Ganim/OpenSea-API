import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CostCenter } from '@/entities/finance/cost-center';
import { costCenterPrismaToDomain } from '@/mappers/finance/cost-center/cost-center-prisma-to-domain';
import { prisma } from '@/lib/prisma';
import type {
  CostCentersRepository,
  CreateCostCenterSchema,
  FindManyCostCentersFilters,
  FindManyPaginatedResult,
  UpdateCostCenterSchema,
} from '../cost-centers-repository';

export class PrismaCostCentersRepository implements CostCentersRepository {
  async create(data: CreateCostCenterSchema): Promise<CostCenter> {
    const costCenter = await prisma.costCenter.create({
      data: {
        tenantId: data.tenantId,
        companyId: data.companyId,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
        monthlyBudget: data.monthlyBudget,
        annualBudget: data.annualBudget,
        parentId: data.parentId,
      },
    });

    return costCenterPrismaToDomain(costCenter);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CostCenter | null> {
    const costCenter = await prisma.costCenter.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!costCenter) return null;
    return costCenterPrismaToDomain(costCenter);
  }

  async findByCode(code: string, tenantId: string): Promise<CostCenter | null> {
    const costCenter = await prisma.costCenter.findFirst({
      where: {
        code,
        tenantId,
        deletedAt: null,
      },
    });

    if (!costCenter) return null;
    return costCenterPrismaToDomain(costCenter);
  }

  async findMany(tenantId: string): Promise<CostCenter[]> {
    const costCenters = await prisma.costCenter.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    return costCenters.map(costCenterPrismaToDomain);
  }

  async findManyPaginated(
    tenantId: string,
    page: number,
    limit: number,
    filters?: FindManyCostCentersFilters,
  ): Promise<FindManyPaginatedResult> {
    // P1-37: honor the orphan query params the frontend was already sending.
    const where: Record<string, unknown> = { tenantId };

    if (filters?.includeDeleted === 'only') {
      where.deletedAt = { not: null };
    } else if (filters?.includeDeleted !== true) {
      where.deletedAt = null;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const sortField = filters?.sortBy ?? 'name';
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [sortField]: filters?.sortOrder ?? 'asc',
    };

    const [costCenters, total] = await Promise.all([
      prisma.costCenter.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.costCenter.count({ where }),
    ]);

    return {
      costCenters: costCenters.map(costCenterPrismaToDomain),
      total,
    };
  }

  async update(data: UpdateCostCenterSchema): Promise<CostCenter | null> {
    const updateData: Record<string, unknown> = {};
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.monthlyBudget !== undefined)
      updateData.monthlyBudget = data.monthlyBudget;
    if (data.annualBudget !== undefined)
      updateData.annualBudget = data.annualBudget;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;

    const result = await prisma.costCenter.updateMany({
      where: {
        id: data.id.toString(),
        tenantId: data.tenantId,
        deletedAt: null,
      },
      data: updateData,
    });

    if (result.count === 0) return null;

    const costCenter = await prisma.costCenter.findUnique({
      where: { id: data.id.toString() },
    });

    return costCenter ? costCenterPrismaToDomain(costCenter) : null;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.costCenter.updateMany({
      where: { id: id.toString(), tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}

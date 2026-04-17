import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CostCenter } from '@/entities/finance/cost-center';
import { costCenterPrismaToDomain } from '@/mappers/finance/cost-center/cost-center-prisma-to-domain';
import { prisma } from '@/lib/prisma';
import type {
  CostCentersRepository,
  CreateCostCenterSchema,
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
  ): Promise<FindManyPaginatedResult> {
    const where = { tenantId, deletedAt: null };
    const [costCenters, total] = await Promise.all([
      prisma.costCenter.findMany({
        where,
        orderBy: { name: 'asc' },
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

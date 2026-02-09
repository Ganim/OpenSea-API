import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CostCenter } from '@/entities/finance/cost-center';
import { costCenterPrismaToDomain } from '@/mappers/finance/cost-center/cost-center-prisma-to-domain';
import { prisma } from '@/lib/prisma';
import type {
  CostCentersRepository,
  CreateCostCenterSchema,
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

  async findById(id: UniqueEntityID, tenantId: string): Promise<CostCenter | null> {
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

  async update(data: UpdateCostCenterSchema): Promise<CostCenter | null> {
    const costCenter = await prisma.costCenter.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.companyId !== undefined && { companyId: data.companyId }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.monthlyBudget !== undefined && { monthlyBudget: data.monthlyBudget }),
        ...(data.annualBudget !== undefined && { annualBudget: data.annualBudget }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
    });

    return costCenterPrismaToDomain(costCenter);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.costCenter.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}

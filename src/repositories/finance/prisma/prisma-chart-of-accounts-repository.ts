import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ChartOfAccount } from '@/entities/finance/chart-of-account';
import { chartOfAccountPrismaToDomain } from '@/mappers/finance/chart-of-account/chart-of-account-prisma-to-domain';
import { prisma } from '@/lib/prisma';
import type {
  AccountClass,
  AccountNature,
  AccountType,
} from '@prisma/generated/client.js';
import type {
  ChartOfAccountsRepository,
  CreateChartOfAccountSchema,
  FindManyChartOfAccountsPaginatedResult,
  UpdateChartOfAccountSchema,
} from '../chart-of-accounts-repository';

export class PrismaChartOfAccountsRepository
  implements ChartOfAccountsRepository
{
  async create(data: CreateChartOfAccountSchema): Promise<ChartOfAccount> {
    const chartOfAccount = await prisma.chartOfAccount.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        type: data.type as AccountType,
        class: data.accountClass as AccountClass,
        nature: data.nature as AccountNature,
        parentId: data.parentId,
        isActive: data.isActive ?? true,
        isSystem: data.isSystem ?? false,
      },
    });

    return chartOfAccountPrismaToDomain(chartOfAccount);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ChartOfAccount | null> {
    const chartOfAccount = await prisma.chartOfAccount.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!chartOfAccount) return null;
    return chartOfAccountPrismaToDomain(chartOfAccount);
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<ChartOfAccount | null> {
    const chartOfAccount = await prisma.chartOfAccount.findFirst({
      where: {
        code,
        tenantId,
        deletedAt: null,
      },
    });

    if (!chartOfAccount) return null;
    return chartOfAccountPrismaToDomain(chartOfAccount);
  }

  async findMany(tenantId: string): Promise<ChartOfAccount[]> {
    const chartOfAccounts = await prisma.chartOfAccount.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { code: 'asc' },
    });

    return chartOfAccounts.map(chartOfAccountPrismaToDomain);
  }

  async findManyPaginated(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<FindManyChartOfAccountsPaginatedResult> {
    const where = { tenantId, deletedAt: null };
    const [chartOfAccounts, total] = await Promise.all([
      prisma.chartOfAccount.findMany({
        where,
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chartOfAccount.count({ where }),
    ]);

    return {
      chartOfAccounts: chartOfAccounts.map(chartOfAccountPrismaToDomain),
      total,
    };
  }

  async findChildren(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<ChartOfAccount[]> {
    const children = await prisma.chartOfAccount.findMany({
      where: {
        parentId: parentId.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    return children.map(chartOfAccountPrismaToDomain);
  }

  async update(
    data: UpdateChartOfAccountSchema,
  ): Promise<ChartOfAccount | null> {
    const chartOfAccount = await prisma.chartOfAccount.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type as AccountType }),
        ...(data.accountClass !== undefined && {
          class: data.accountClass as AccountClass,
        }),
        ...(data.nature !== undefined && {
          nature: data.nature as AccountNature,
        }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return chartOfAccountPrismaToDomain(chartOfAccount);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.chartOfAccount.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}

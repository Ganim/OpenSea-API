import type { RecurringConfig } from '@/entities/finance/recurring-config';
import { recurringConfigPrismaToDomain } from '@/mappers/finance/recurring-config/recurring-config-prisma-to-domain';
import { prisma } from '@/lib/prisma';
import type {
  CreateRecurringConfigSchema,
  FindManyRecurringConfigsOptions,
  FindManyRecurringConfigsResult,
  RecurringConfigsRepository,
  UpdateRecurringConfigSchema,
} from '../recurring-configs-repository';

export class PrismaRecurringConfigsRepository
  implements RecurringConfigsRepository
{
  async create(data: CreateRecurringConfigSchema): Promise<RecurringConfig> {
    const raw = await prisma.recurringConfig.create({
      data: {
        tenantId: data.tenantId,
        type: data.type as 'PAYABLE' | 'RECEIVABLE',
        description: data.description,
        categoryId: data.categoryId,
        costCenterId: data.costCenterId,
        bankAccountId: data.bankAccountId,
        supplierName: data.supplierName,
        customerName: data.customerName,
        supplierId: data.supplierId,
        customerId: data.customerId,
        expectedAmount: data.expectedAmount,
        isVariable: data.isVariable ?? false,
        frequencyUnit: data.frequencyUnit as
          | 'DAILY'
          | 'WEEKLY'
          | 'BIWEEKLY'
          | 'MONTHLY'
          | 'QUARTERLY'
          | 'SEMIANNUAL'
          | 'ANNUAL',
        frequencyInterval: data.frequencyInterval ?? 1,
        startDate: data.startDate,
        endDate: data.endDate,
        totalOccurrences: data.totalOccurrences,
        nextDueDate: data.nextDueDate,
        interestRate: data.interestRate,
        penaltyRate: data.penaltyRate,
        notes: data.notes,
        createdBy: data.createdBy,
      },
    });

    return recurringConfigPrismaToDomain(raw);
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<RecurringConfig | null> {
    const raw = await prisma.recurringConfig.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!raw) return null;
    return recurringConfigPrismaToDomain(raw);
  }

  async findMany(
    options: FindManyRecurringConfigsOptions,
  ): Promise<FindManyRecurringConfigsResult> {
    const { tenantId, page = 1, limit = 20, type, status, search } = options;

    const where = {
      tenantId,
      deletedAt: null,
      ...(type && { type: type as 'PAYABLE' | 'RECEIVABLE' }),
      ...(status && {
        status: status as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
      }),
      ...(search && {
        description: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const sortFieldMap: Record<string, string> = {
      createdAt: 'createdAt',
      description: 'description',
      baseAmount: 'expectedAmount',
      status: 'status',
    };

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[sortFieldMap[options.sortBy || 'createdAt'] || 'createdAt'] =
      options.sortOrder || 'desc';

    const [configs, total] = await Promise.all([
      prisma.recurringConfig.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.recurringConfig.count({ where }),
    ]);

    return {
      configs: configs.map(recurringConfigPrismaToDomain),
      total,
    };
  }

  async findActiveForGeneration(
    endDate: Date,
    tenantId: string,
  ): Promise<RecurringConfig[]> {
    const configs = await prisma.recurringConfig.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
        nextDueDate: {
          lte: endDate,
        },
      },
    });

    return configs.map(recurringConfigPrismaToDomain);
  }

  async update(
    data: UpdateRecurringConfigSchema,
  ): Promise<RecurringConfig | null> {
    const updateData: Record<string, unknown> = {};

    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.expectedAmount !== undefined)
      updateData.expectedAmount = data.expectedAmount;
    if (data.frequencyUnit !== undefined)
      updateData.frequencyUnit = data.frequencyUnit;
    if (data.frequencyInterval !== undefined)
      updateData.frequencyInterval = data.frequencyInterval;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.interestRate !== undefined)
      updateData.interestRate = data.interestRate;
    if (data.penaltyRate !== undefined)
      updateData.penaltyRate = data.penaltyRate;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.generatedCount !== undefined)
      updateData.generatedCount = data.generatedCount;
    if (data.lastGeneratedDate !== undefined)
      updateData.lastGeneratedDate = data.lastGeneratedDate;
    if (data.nextDueDate !== undefined)
      updateData.nextDueDate = data.nextDueDate;
    if (data.bankAccountId !== undefined)
      updateData.bankAccountId = data.bankAccountId;
    if (data.costCenterId !== undefined)
      updateData.costCenterId = data.costCenterId;

    const raw = await prisma.recurringConfig.update({
      where: { id: data.id },
      data: updateData,
    });

    return recurringConfigPrismaToDomain(raw);
  }

  async delete(id: string, _tenantId: string): Promise<void> {
    await prisma.recurringConfig.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

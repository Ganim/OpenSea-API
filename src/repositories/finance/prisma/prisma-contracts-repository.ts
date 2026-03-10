import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Contract } from '@/entities/finance/contract';
import {
  Prisma,
  type ContractStatus,
  type RecurrenceUnit,
} from '@prisma/generated/client.js';
import type {
  ContractsRepository,
  CreateContractSchema,
  UpdateContractSchema,
  FindManyContractsOptions,
  FindManyContractsResult,
} from '../contracts-repository';

function contractPrismaToDomain(raw: {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  companyId: string | null;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  totalValue: Prisma.Decimal;
  paymentFrequency: string;
  paymentAmount: Prisma.Decimal;
  categoryId: string | null;
  costCenterId: string | null;
  bankAccountId: string | null;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  renewalPeriodMonths: number | null;
  alertDaysBefore: number;
  folderPath: string | null;
  notes: string | null;
  metadata: Prisma.JsonValue;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Contract {
  return Contract.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      code: raw.code,
      title: raw.title,
      description: raw.description ?? undefined,
      status: raw.status,
      companyId: raw.companyId ?? undefined,
      companyName: raw.companyName,
      contactName: raw.contactName ?? undefined,
      contactEmail: raw.contactEmail ?? undefined,
      totalValue: Number(raw.totalValue),
      paymentFrequency: raw.paymentFrequency,
      paymentAmount: Number(raw.paymentAmount),
      categoryId: raw.categoryId ?? undefined,
      costCenterId: raw.costCenterId ?? undefined,
      bankAccountId: raw.bankAccountId ?? undefined,
      startDate: raw.startDate,
      endDate: raw.endDate,
      autoRenew: raw.autoRenew,
      renewalPeriodMonths: raw.renewalPeriodMonths ?? undefined,
      alertDaysBefore: raw.alertDaysBefore,
      folderPath: raw.folderPath ?? undefined,
      notes: raw.notes ?? undefined,
      metadata: (raw.metadata as Record<string, unknown>) ?? {},
      createdBy: raw.createdBy ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaContractsRepository implements ContractsRepository {
  async create(data: CreateContractSchema, tx?: TransactionClient): Promise<Contract> {
    const client = tx ?? prisma;

    const contract = await client.contract.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        title: data.title,
        description: data.description,
        status: (data.status ?? 'ACTIVE') as ContractStatus,
        companyId: data.companyId,
        companyName: data.companyName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        totalValue: new Prisma.Decimal(data.totalValue),
        paymentFrequency: data.paymentFrequency as RecurrenceUnit,
        paymentAmount: new Prisma.Decimal(data.paymentAmount),
        categoryId: data.categoryId,
        costCenterId: data.costCenterId,
        bankAccountId: data.bankAccountId,
        startDate: data.startDate,
        endDate: data.endDate,
        autoRenew: data.autoRenew ?? false,
        renewalPeriodMonths: data.renewalPeriodMonths,
        alertDaysBefore: data.alertDaysBefore ?? 30,
        folderPath: data.folderPath,
        notes: data.notes,
        metadata: (data.metadata ?? {}) as Record<string, never>,
        createdBy: data.createdBy,
      },
    });

    return contractPrismaToDomain(contract);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Contract | null> {
    const contract = await prisma.contract.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!contract) return null;
    return contractPrismaToDomain(contract);
  }

  async findMany(options: FindManyContractsOptions): Promise<FindManyContractsResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const where: Prisma.ContractWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
    };

    if (options.status) where.status = options.status as ContractStatus;
    if (options.companyId) where.companyId = options.companyId;

    if (options.companyName) {
      where.companyName = { contains: options.companyName, mode: 'insensitive' };
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { companyName: { contains: options.search, mode: 'insensitive' } },
        { code: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.startDateFrom || options.startDateTo) {
      where.startDate = {};
      if (options.startDateFrom) where.startDate.gte = options.startDateFrom;
      if (options.startDateTo) where.startDate.lte = options.startDateTo;
    }

    if (options.endDateFrom || options.endDateTo) {
      where.endDate = {};
      if (options.endDateFrom) where.endDate.gte = options.endDateFrom;
      if (options.endDateTo) where.endDate.lte = options.endDateTo;
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      contracts: contracts.map(contractPrismaToDomain),
      total,
    };
  }

  async findByCompanyId(companyId: string, tenantId: string): Promise<Contract[]> {
    const contracts = await prisma.contract.findMany({
      where: { companyId, tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return contracts.map(contractPrismaToDomain);
  }

  async findByCompanyName(companyName: string, tenantId: string): Promise<Contract[]> {
    const contracts = await prisma.contract.findMany({
      where: {
        companyName: { contains: companyName, mode: 'insensitive' },
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return contracts.map(contractPrismaToDomain);
  }

  async update(data: UpdateContractSchema): Promise<Contract | null> {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status as ContractStatus;
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.contactName !== undefined) updateData.contactName = data.contactName;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
    if (data.totalValue !== undefined) updateData.totalValue = new Prisma.Decimal(data.totalValue);
    if (data.paymentFrequency !== undefined) updateData.paymentFrequency = data.paymentFrequency as RecurrenceUnit;
    if (data.paymentAmount !== undefined) updateData.paymentAmount = new Prisma.Decimal(data.paymentAmount);
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.costCenterId !== undefined) updateData.costCenterId = data.costCenterId;
    if (data.bankAccountId !== undefined) updateData.bankAccountId = data.bankAccountId;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.autoRenew !== undefined) updateData.autoRenew = data.autoRenew;
    if (data.renewalPeriodMonths !== undefined) updateData.renewalPeriodMonths = data.renewalPeriodMonths;
    if (data.alertDaysBefore !== undefined) updateData.alertDaysBefore = data.alertDaysBefore;
    if (data.folderPath !== undefined) updateData.folderPath = data.folderPath;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const contract = await prisma.contract.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return contractPrismaToDomain(contract);
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const whereClause: { id: string; tenantId?: string } = {
      id: id.toString(),
    };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    await prisma.contract.update({
      where: whereClause,
      data: { deletedAt: new Date() },
    });
  }
}

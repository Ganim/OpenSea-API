import { prisma } from '@/lib/prisma';
import { financeEntryPrismaToDomain } from '@/mappers/finance/finance-entry/finance-entry-prisma-to-domain';
import {
  Prisma,
  type FinanceEntryType,
  type FinanceEntryStatus,
  type FinanceEntryRecurrence,
  type RecurrenceUnit,
} from '@prisma/generated/client.js';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import type {
  FinanceEntriesRepository,
  CreateFinanceEntrySchema,
  UpdateFinanceEntrySchema,
  FindManyFinanceEntriesOptions,
  FindManyResult,
} from '../finance-entries-repository';

export class PrismaFinanceEntriesRepository implements FinanceEntriesRepository {
  async create(data: CreateFinanceEntrySchema): Promise<FinanceEntry> {
    const entry = await prisma.financeEntry.create({
      data: {
        tenantId: data.tenantId,
        type: data.type as FinanceEntryType,
        code: data.code,
        description: data.description,
        notes: data.notes,
        categoryId: data.categoryId,
        costCenterId: data.costCenterId,
        bankAccountId: data.bankAccountId,
        supplierName: data.supplierName,
        customerName: data.customerName,
        supplierId: data.supplierId,
        customerId: data.customerId,
        salesOrderId: data.salesOrderId,
        expectedAmount: new Prisma.Decimal(data.expectedAmount),
        actualAmount: data.actualAmount !== undefined ? new Prisma.Decimal(data.actualAmount) : undefined,
        discount: new Prisma.Decimal(data.discount ?? 0),
        interest: new Prisma.Decimal(data.interest ?? 0),
        penalty: new Prisma.Decimal(data.penalty ?? 0),
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        competenceDate: data.competenceDate,
        paymentDate: data.paymentDate,
        status: (data.status as FinanceEntryStatus) ?? 'PENDING',
        recurrenceType: (data.recurrenceType as FinanceEntryRecurrence) ?? 'SINGLE',
        recurrenceInterval: data.recurrenceInterval,
        recurrenceUnit: data.recurrenceUnit as RecurrenceUnit | undefined,
        totalInstallments: data.totalInstallments,
        currentInstallment: data.currentInstallment,
        parentEntryId: data.parentEntryId,
        boletoBarcode: data.boletoBarcode,
        boletoDigitLine: data.boletoDigitLine,
        metadata: (data.metadata ?? {}) as Record<string, never>,
        tags: data.tags ?? [],
        createdBy: data.createdBy,
      },
    });

    return financeEntryPrismaToDomain(entry);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<FinanceEntry | null> {
    const entry = await prisma.financeEntry.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!entry) return null;
    return financeEntryPrismaToDomain(entry);
  }

  async findByCode(code: string, tenantId: string): Promise<FinanceEntry | null> {
    const entry = await prisma.financeEntry.findFirst({
      where: {
        code,
        tenantId,
        deletedAt: null,
      },
    });

    if (!entry) return null;
    return financeEntryPrismaToDomain(entry);
  }

  async findMany(options: FindManyFinanceEntriesOptions): Promise<FindManyResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const where: Prisma.FinanceEntryWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
    };

    if (options.type) {
      where.type = options.type as FinanceEntryType;
    }

    if (options.status) {
      where.status = options.status as FinanceEntryStatus;
    }

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.costCenterId) {
      where.costCenterId = options.costCenterId;
    }

    if (options.bankAccountId) {
      where.bankAccountId = options.bankAccountId;
    }

    if (options.dueDateFrom || options.dueDateTo) {
      where.dueDate = {
        ...(options.dueDateFrom && { gte: options.dueDateFrom }),
        ...(options.dueDateTo && { lte: options.dueDateTo }),
      };
    }

    if (options.isOverdue) {
      where.dueDate = { lt: new Date() };
      where.status = {
        notIn: ['PAID', 'RECEIVED', 'CANCELLED'] as FinanceEntryStatus[],
      };
    }

    if (options.customerName) {
      where.customerName = { contains: options.customerName, mode: 'insensitive' };
    }

    if (options.supplierName) {
      where.supplierName = { contains: options.supplierName, mode: 'insensitive' };
    }

    if (options.overdueRange) {
      const now = new Date();
      let dateFrom: Date;
      let dateTo: Date;

      switch (options.overdueRange) {
        case '1-7': {
          dateTo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        }
        case '8-30': {
          dateTo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        }
        case '31-60': {
          dateTo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
          dateFrom = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
          break;
        }
        case '60+': {
          dateTo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
          dateFrom = new Date(0);
          break;
        }
        default: {
          dateTo = now;
          dateFrom = new Date(0);
        }
      }

      where.dueDate = { gte: dateFrom, lte: dateTo };
      where.status = {
        notIn: ['PAID', 'RECEIVED', 'CANCELLED'] as FinanceEntryStatus[],
      };
    }

    if (options.parentEntryId) {
      where.parentEntryId = options.parentEntryId;
    }

    if (options.search) {
      where.OR = [
        { code: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { supplierName: { contains: options.search, mode: 'insensitive' } },
        { customerName: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.financeEntry.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.financeEntry.count({ where }),
    ]);

    return {
      entries: entries.map(financeEntryPrismaToDomain),
      total,
    };
  }

  async update(data: UpdateFinanceEntrySchema): Promise<FinanceEntry | null> {
    const entry = await prisma.financeEntry.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.description !== undefined && { description: data.description }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.costCenterId !== undefined && { costCenterId: data.costCenterId }),
        ...(data.bankAccountId !== undefined && { bankAccountId: data.bankAccountId }),
        ...(data.supplierName !== undefined && { supplierName: data.supplierName }),
        ...(data.customerName !== undefined && { customerName: data.customerName }),
        ...(data.expectedAmount !== undefined && { expectedAmount: new Prisma.Decimal(data.expectedAmount) }),
        ...(data.discount !== undefined && { discount: new Prisma.Decimal(data.discount) }),
        ...(data.interest !== undefined && { interest: new Prisma.Decimal(data.interest) }),
        ...(data.penalty !== undefined && { penalty: new Prisma.Decimal(data.penalty) }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.competenceDate !== undefined && { competenceDate: data.competenceDate }),
        ...(data.status !== undefined && { status: data.status as FinanceEntryStatus }),
        ...(data.actualAmount !== undefined && { actualAmount: new Prisma.Decimal(data.actualAmount) }),
        ...(data.paymentDate !== undefined && { paymentDate: data.paymentDate }),
        ...(data.boletoBarcode !== undefined && { boletoBarcode: data.boletoBarcode }),
        ...(data.boletoDigitLine !== undefined && { boletoDigitLine: data.boletoDigitLine }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });

    return financeEntryPrismaToDomain(entry);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.financeEntry.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }

  async generateNextCode(tenantId: string, type: string): Promise<string> {
    const count = await prisma.financeEntry.count({
      where: {
        tenantId,
        type: type as FinanceEntryType,
      },
    });

    const prefix = type === 'PAYABLE' ? 'PAG' : 'REC';
    const nextNumber = (count + 1).toString().padStart(3, '0');

    return `${prefix}-${nextNumber}`;
  }
}

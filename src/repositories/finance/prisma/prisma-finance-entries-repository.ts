import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { financeEntryPrismaToDomain } from '@/mappers/finance/finance-entry/finance-entry-prisma-to-domain';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
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
  DateRangeSum,
  CategorySum,
  CostCenterSum,
  OverdueSum,
  OverdueByParty,
  CategoryFrequency,
} from '../finance-entries-repository';

const { encryptedFields } = ENCRYPTED_FIELD_CONFIG.FinanceEntry;

function tryGetCipher() {
  try {
    return getFieldCipherService();
  } catch {
    return null;
  }
}

export class PrismaFinanceEntriesRepository
  implements FinanceEntriesRepository
{
  async create(
    data: CreateFinanceEntrySchema,
    tx?: TransactionClient,
  ): Promise<FinanceEntry> {
    const client = tx ?? prisma;
    const cipher = tryGetCipher();

    // Encrypt sensitive fields (boleto only — names are plaintext)
    const encryptedData = cipher
      ? cipher.encryptFields(
          {
            boletoBarcode: data.boletoBarcode,
            boletoDigitLine: data.boletoDigitLine,
          },
          encryptedFields,
        )
      : {
          boletoBarcode: data.boletoBarcode,
          boletoDigitLine: data.boletoDigitLine,
        };

    const entry = await client.financeEntry.create({
      data: {
        tenantId: data.tenantId,
        type: data.type as FinanceEntryType,
        code: data.code,
        description: data.description,
        notes: data.notes,
        categoryId: data.categoryId,
        chartOfAccountId: data.chartOfAccountId,
        companyId: data.companyId,
        costCenterId: data.costCenterId,
        bankAccountId: data.bankAccountId,
        supplierName: data.supplierName,
        customerName: data.customerName,
        supplierId: data.supplierId,
        customerId: data.customerId,
        salesOrderId: data.salesOrderId,
        expectedAmount: new Prisma.Decimal(data.expectedAmount),
        actualAmount:
          data.actualAmount !== undefined
            ? new Prisma.Decimal(data.actualAmount)
            : undefined,
        discount: new Prisma.Decimal(data.discount ?? 0),
        interest: new Prisma.Decimal(data.interest ?? 0),
        penalty: new Prisma.Decimal(data.penalty ?? 0),
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        competenceDate: data.competenceDate,
        paymentDate: data.paymentDate,
        status: (data.status as FinanceEntryStatus) ?? 'PENDING',
        recurrenceType:
          (data.recurrenceType as FinanceEntryRecurrence) ?? 'SINGLE',
        recurrenceInterval: data.recurrenceInterval,
        recurrenceUnit: data.recurrenceUnit as RecurrenceUnit | undefined,
        totalInstallments: data.totalInstallments,
        currentInstallment: data.currentInstallment,
        parentEntryId: data.parentEntryId,
        boletoBarcode: encryptedData.boletoBarcode,
        boletoDigitLine: encryptedData.boletoDigitLine,
        boletoChargeId: data.boletoChargeId,
        boletoBarcodeNumber: data.boletoBarcodeNumber,
        boletoDigitableLine: data.boletoDigitableLine,
        boletoPdfUrl: data.boletoPdfUrl,
        beneficiaryName: data.beneficiaryName,
        beneficiaryCpfCnpj: data.beneficiaryCpfCnpj,
        pixKey: data.pixKey,
        pixKeyType: data.pixKeyType,
        metadata: (data.metadata ?? {}) as Record<string, never>,
        tags: data.tags ?? [],
        createdBy: data.createdBy,
      },
    });

    // Decrypt before passing to mapper
    const decrypted = cipher
      ? cipher.decryptFields(entry as Record<string, unknown>, encryptedFields)
      : entry;

    return financeEntryPrismaToDomain(decrypted as typeof entry);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<FinanceEntry | null> {
    const client = tx ?? prisma;
    const entry = await client.financeEntry.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!entry) return null;

    const cipher = tryGetCipher();
    const decrypted = cipher
      ? cipher.decryptFields(entry as Record<string, unknown>, encryptedFields)
      : entry;

    return financeEntryPrismaToDomain(decrypted as typeof entry);
  }

  async findByIdForUpdate(
    id: UniqueEntityID,
    tenantId: string,
    tx: TransactionClient,
  ): Promise<FinanceEntry | null> {
    // Acquire row-level lock — concurrent transactions block here
    const rows = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT "id" FROM "finance_entries"
        WHERE "id" = ${id.toString()}
          AND "tenant_id" = ${tenantId}
          AND "deleted_at" IS NULL
        FOR UPDATE
      `,
    );

    if (rows.length === 0) return null;

    // Re-fetch with Prisma for proper field mapping and decryption
    const entry = await tx.financeEntry.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!entry) return null;

    const cipher = tryGetCipher();
    const decrypted = cipher
      ? cipher.decryptFields(entry as Record<string, unknown>, encryptedFields)
      : entry;

    return financeEntryPrismaToDomain(decrypted as typeof entry);
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<FinanceEntry | null> {
    const entry = await prisma.financeEntry.findFirst({
      where: {
        code,
        tenantId,
        deletedAt: null,
      },
    });

    if (!entry) return null;

    const cipher = tryGetCipher();
    const decrypted = cipher
      ? cipher.decryptFields(entry as Record<string, unknown>, encryptedFields)
      : entry;

    return financeEntryPrismaToDomain(decrypted as typeof entry);
  }

  async findMany(
    options: FindManyFinanceEntriesOptions,
    tx?: TransactionClient,
  ): Promise<FindManyResult> {
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
      const statuses = options.status.includes(',')
        ? options.status.split(',')
        : [options.status];
      if (statuses.length === 1) {
        where.status = statuses[0] as FinanceEntryStatus;
      } else {
        where.status = { in: statuses as FinanceEntryStatus[] };
      }
    }

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.companyId) {
      where.companyId = options.companyId;
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

    if (options.competenceDateFrom || options.competenceDateTo) {
      if (options.competenceDateFallbackToIssueDate) {
        // For accrual reports: use competenceDate when available, fall back to issueDate
        where.OR = [
          {
            competenceDate: {
              ...(options.competenceDateFrom && {
                gte: options.competenceDateFrom,
              }),
              ...(options.competenceDateTo && {
                lte: options.competenceDateTo,
              }),
            },
          },
          {
            competenceDate: null,
            issueDate: {
              ...(options.competenceDateFrom && {
                gte: options.competenceDateFrom,
              }),
              ...(options.competenceDateTo && {
                lte: options.competenceDateTo,
              }),
            },
          },
        ];
      } else {
        where.competenceDate = {
          ...(options.competenceDateFrom && {
            gte: options.competenceDateFrom,
          }),
          ...(options.competenceDateTo && { lte: options.competenceDateTo }),
        };
      }
    }

    if (options.isOverdue) {
      where.dueDate = { lt: new Date() };
      where.status = {
        notIn: ['PAID', 'RECEIVED', 'CANCELLED'] as FinanceEntryStatus[],
      };
    }

    if (options.customerName) {
      where.customerName = {
        contains: options.customerName,
        mode: 'insensitive',
      };
    }

    if (options.supplierName) {
      where.supplierName = {
        contains: options.supplierName,
        mode: 'insensitive',
      };
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

    if (options.createdByUserId) {
      where.createdBy = options.createdByUserId;
    }

    if (options.search) {
      where.OR = [
        { code: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { supplierName: { contains: options.search, mode: 'insensitive' } },
        { customerName: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const client = tx ?? prisma;

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[options.sortBy || 'createdAt'] = options.sortOrder || 'desc';

    const [entries, total] = await Promise.all([
      client.financeEntry.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      client.financeEntry.count({ where }),
    ]);

    const cipher = tryGetCipher();

    return {
      entries: entries.map((e) => {
        const decrypted = cipher
          ? cipher.decryptFields(e as Record<string, unknown>, encryptedFields)
          : e;
        return financeEntryPrismaToDomain(decrypted as typeof e);
      }),
      total,
    };
  }

  async update(
    data: UpdateFinanceEntrySchema,
    tx?: TransactionClient,
  ): Promise<FinanceEntry | null> {
    const cipher = tryGetCipher();

    // Build update data object with original values first
    const updateData: Record<string, unknown> = {
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.costCenterId !== undefined && {
        costCenterId: data.costCenterId,
      }),
      ...(data.bankAccountId !== undefined && {
        bankAccountId: data.bankAccountId,
      }),
      ...(data.supplierName !== undefined && {
        supplierName: data.supplierName,
      }),
      ...(data.customerName !== undefined && {
        customerName: data.customerName,
      }),
      ...(data.expectedAmount !== undefined && {
        expectedAmount: new Prisma.Decimal(data.expectedAmount),
      }),
      ...(data.discount !== undefined && {
        discount: new Prisma.Decimal(data.discount),
      }),
      ...(data.interest !== undefined && {
        interest: new Prisma.Decimal(data.interest),
      }),
      ...(data.penalty !== undefined && {
        penalty: new Prisma.Decimal(data.penalty),
      }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.competenceDate !== undefined && {
        competenceDate: data.competenceDate,
      }),
      ...(data.status !== undefined && {
        status: data.status as FinanceEntryStatus,
      }),
      ...(data.actualAmount !== undefined && {
        actualAmount: new Prisma.Decimal(data.actualAmount),
      }),
      ...(data.paymentDate !== undefined && {
        paymentDate: data.paymentDate,
      }),
      ...(data.boletoBarcode !== undefined && {
        boletoBarcode: data.boletoBarcode,
      }),
      ...(data.boletoDigitLine !== undefined && {
        boletoDigitLine: data.boletoDigitLine,
      }),
      ...(data.boletoChargeId !== undefined && {
        boletoChargeId: data.boletoChargeId,
      }),
      ...(data.boletoBarcodeNumber !== undefined && {
        boletoBarcodeNumber: data.boletoBarcodeNumber,
      }),
      ...(data.boletoDigitableLine !== undefined && {
        boletoDigitableLine: data.boletoDigitableLine,
      }),
      ...(data.boletoPdfUrl !== undefined && {
        boletoPdfUrl: data.boletoPdfUrl,
      }),
      ...(data.beneficiaryName !== undefined && {
        beneficiaryName: data.beneficiaryName,
      }),
      ...(data.beneficiaryCpfCnpj !== undefined && {
        beneficiaryCpfCnpj: data.beneficiaryCpfCnpj,
      }),
      ...(data.pixKey !== undefined && {
        pixKey: data.pixKey,
      }),
      ...(data.pixKeyType !== undefined && {
        pixKeyType: data.pixKeyType,
      }),
      ...(data.pixChargeId !== undefined && {
        pixChargeId: data.pixChargeId,
      }),
      ...(data.fiscalDocumentId !== undefined && {
        fiscalDocumentId: data.fiscalDocumentId,
      }),
      ...(data.tags !== undefined && { tags: data.tags }),
    };

    // Encrypt the sensitive fields in updateData
    const encryptedUpdateData = cipher
      ? cipher.encryptFields(updateData, encryptedFields)
      : updateData;

    const client = tx ?? prisma;

    // Tenant-scoped update — guarantees we never mutate another tenant's row
    const updateResult = await client.financeEntry.updateMany({
      where: {
        id: data.id.toString(),
        tenantId: data.tenantId,
        deletedAt: null,
      },
      data: encryptedUpdateData as Prisma.FinanceEntryUpdateManyMutationInput,
    });

    if (updateResult.count === 0) {
      return null;
    }

    const entry = await client.financeEntry.findFirst({
      where: {
        id: data.id.toString(),
        tenantId: data.tenantId,
      },
    });

    if (!entry) return null;

    // Decrypt before passing to mapper
    const decrypted = cipher
      ? cipher.decryptFields(entry as Record<string, unknown>, encryptedFields)
      : entry;

    return financeEntryPrismaToDomain(decrypted as typeof entry);
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.financeEntry.updateMany({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  }

  async generateNextCode(
    tenantId: string,
    type: string,
    tx?: TransactionClient,
  ): Promise<string> {
    const client = tx ?? prisma;
    const prefix = type === 'PAYABLE' ? 'PAG' : 'REC';

    // Atomic upsert + increment using INSERT ... ON CONFLICT DO UPDATE
    // This avoids race conditions where two concurrent requests get the same code
    const result = await client.$queryRaw<[{ last_value: number }]>`
      INSERT INTO finance_code_sequences (id, tenant_id, prefix, last_value)
      VALUES (gen_random_uuid(), ${tenantId}, ${prefix}, 1)
      ON CONFLICT (tenant_id, prefix)
      DO UPDATE SET last_value = finance_code_sequences.last_value + 1
      RETURNING last_value
    `;

    const nextNumber = result[0].last_value.toString().padStart(3, '0');
    return `${prefix}-${nextNumber}`;
  }

  async sumByDateRange(
    tenantId: string,
    type: string | undefined,
    from: Date,
    to: Date,
    groupBy: 'day' | 'week' | 'month',
    statusIn?: string[],
  ): Promise<DateRangeSum[]> {
    type RawDateSum = { date: Date; total: Prisma.Decimal };

    // P0-09: build a status filter clause when callers pass it. Without
    // this, cashflow / predictive / balance-sheet were summing CANCELLED
    // and already-PAID entries as forward-looking obligations.
    const statusClause = statusIn && statusIn.length > 0
      ? Prisma.sql`AND "status"::text = ANY(${statusIn}::text[])`
      : Prisma.empty;

    const baseQuery = (truncExpr: Prisma.Sql) =>
      type
        ? prisma.$queryRaw<RawDateSum[]>`
            SELECT ${truncExpr} as date, SUM("expected_amount") as total
            FROM "finance_entries"
            WHERE "tenant_id" = ${tenantId}
              AND "deleted_at" IS NULL
              AND "due_date" >= ${from}
              AND "due_date" <= ${to}
              AND "type" = ${type}::"FinanceEntryType"
              ${statusClause}
            GROUP BY date
            ORDER BY date ASC`
        : prisma.$queryRaw<RawDateSum[]>`
            SELECT ${truncExpr} as date, SUM("expected_amount") as total
            FROM "finance_entries"
            WHERE "tenant_id" = ${tenantId}
              AND "deleted_at" IS NULL
              AND "due_date" >= ${from}
              AND "due_date" <= ${to}
              ${statusClause}
            GROUP BY date
            ORDER BY date ASC`;

    const truncExpr =
      groupBy === 'day'
        ? Prisma.sql`date_trunc('day', "due_date")`
        : groupBy === 'week'
          ? Prisma.sql`date_trunc('week', "due_date")`
          : Prisma.sql`date_trunc('month', "due_date")`;

    const results = await baseQuery(truncExpr);

    return results.map((r) => ({
      date:
        r.date instanceof Date
          ? r.date.toISOString().split('T')[0]
          : String(r.date),
      total:
        r.total !== null && r.total !== undefined
          ? Number(parseFloat(String(r.total)).toFixed(2))
          : 0,
    }));
  }

  async sumByCategory(
    tenantId: string,
    type: string | undefined,
    from: Date,
    to: Date,
  ): Promise<CategorySum[]> {
    type RawCategorySum = {
      categoryId: string;
      categoryName: string;
      total: Prisma.Decimal;
    };

    const results = type
      ? await prisma.$queryRaw<RawCategorySum[]>`
          SELECT e."category_id" as "categoryId", c."name" as "categoryName", SUM(e."expected_amount") as total
          FROM "finance_entries" e
          JOIN "finance_categories" c ON c."id" = e."category_id"
          WHERE e."tenant_id" = ${tenantId}
            AND e."deleted_at" IS NULL
            AND e."due_date" >= ${from}
            AND e."due_date" <= ${to}
            AND e."type" = ${type}::"FinanceEntryType"
          GROUP BY e."category_id", c."name"
          ORDER BY total DESC`
      : await prisma.$queryRaw<RawCategorySum[]>`
          SELECT e."category_id" as "categoryId", c."name" as "categoryName", SUM(e."expected_amount") as total
          FROM "finance_entries" e
          JOIN "finance_categories" c ON c."id" = e."category_id"
          WHERE e."tenant_id" = ${tenantId}
            AND e."deleted_at" IS NULL
            AND e."due_date" >= ${from}
            AND e."due_date" <= ${to}
          GROUP BY e."category_id", c."name"
          ORDER BY total DESC`;

    return results.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      total:
        r.total !== null && r.total !== undefined
          ? Number(parseFloat(String(r.total)).toFixed(2))
          : 0,
    }));
  }

  async sumByCostCenter(
    tenantId: string,
    type: string | undefined,
    from: Date,
    to: Date,
  ): Promise<CostCenterSum[]> {
    type RawCostCenterSum = {
      costCenterId: string;
      costCenterName: string;
      total: Prisma.Decimal;
    };

    const results = type
      ? await prisma.$queryRaw<RawCostCenterSum[]>`
          SELECT e."cost_center_id" as "costCenterId", cc."name" as "costCenterName", SUM(e."expected_amount") as total
          FROM "finance_entries" e
          JOIN "cost_centers" cc ON cc."id" = e."cost_center_id"
          WHERE e."tenant_id" = ${tenantId}
            AND e."deleted_at" IS NULL
            AND e."due_date" >= ${from}
            AND e."due_date" <= ${to}
            AND e."type" = ${type}::"FinanceEntryType"
          GROUP BY e."cost_center_id", cc."name"
          ORDER BY total DESC`
      : await prisma.$queryRaw<RawCostCenterSum[]>`
          SELECT e."cost_center_id" as "costCenterId", cc."name" as "costCenterName", SUM(e."expected_amount") as total
          FROM "finance_entries" e
          JOIN "cost_centers" cc ON cc."id" = e."cost_center_id"
          WHERE e."tenant_id" = ${tenantId}
            AND e."deleted_at" IS NULL
            AND e."due_date" >= ${from}
            AND e."due_date" <= ${to}
          GROUP BY e."cost_center_id", cc."name"
          ORDER BY total DESC`;

    return results.map((r) => ({
      costCenterId: r.costCenterId,
      costCenterName: r.costCenterName,
      total:
        r.total !== null && r.total !== undefined
          ? Number(parseFloat(String(r.total)).toFixed(2))
          : 0,
    }));
  }

  async countByStatus(
    tenantId: string,
    type?: string,
  ): Promise<Record<string, number>> {
    const where: Prisma.FinanceEntryWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (type) {
      where.type = type as FinanceEntryType;
    }

    const results = await prisma.financeEntry.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r.status] = r._count.id;
    }
    return counts;
  }

  async sumOverdue(tenantId: string, type: string): Promise<OverdueSum> {
    const result = await prisma.financeEntry.aggregate({
      where: {
        tenantId,
        type: type as FinanceEntryType,
        deletedAt: null,
        dueDate: { lt: new Date() },
        status: {
          notIn: ['PAID', 'RECEIVED', 'CANCELLED'] as FinanceEntryStatus[],
        },
      },
      _sum: { expectedAmount: true },
      _count: { id: true },
    });

    return {
      total:
        result._sum.expectedAmount !== null &&
        result._sum.expectedAmount !== undefined
          ? Number(parseFloat(String(result._sum.expectedAmount)).toFixed(2))
          : 0,
      count: result._count.id,
    };
  }

  async topOverdueByCustomer(
    tenantId: string,
    limit = 10,
  ): Promise<OverdueByParty[]> {
    const results = await prisma.$queryRaw<
      {
        name: string;
        total: Prisma.Decimal;
        count: bigint;
        oldestDueDate: Date;
      }[]
    >`
      SELECT "customer_name" as name, SUM("expected_amount") as total, COUNT(*) as count, MIN("due_date") as "oldestDueDate"
      FROM "finance_entries"
      WHERE "tenant_id" = ${tenantId}
        AND "deleted_at" IS NULL
        AND "type" = 'RECEIVABLE'
        AND "due_date" < NOW()
        AND "status" NOT IN ('PAID', 'RECEIVED', 'CANCELLED')
        AND "customer_name" IS NOT NULL
      GROUP BY "customer_name"
      ORDER BY total DESC
      LIMIT ${limit}`;

    return results.map((r) => ({
      name: r.name,
      total:
        r.total !== null && r.total !== undefined
          ? Number(parseFloat(String(r.total)).toFixed(2))
          : 0,
      count: Number(r.count),
      oldestDueDate: r.oldestDueDate,
    }));
  }

  async topOverdueBySupplier(
    tenantId: string,
    limit = 10,
  ): Promise<OverdueByParty[]> {
    const results = await prisma.$queryRaw<
      {
        name: string;
        total: Prisma.Decimal;
        count: bigint;
        oldestDueDate: Date;
      }[]
    >`
      SELECT "supplier_name" as name, SUM("expected_amount") as total, COUNT(*) as count, MIN("due_date") as "oldestDueDate"
      FROM "finance_entries"
      WHERE "tenant_id" = ${tenantId}
        AND "deleted_at" IS NULL
        AND "type" = 'PAYABLE'
        AND "due_date" < NOW()
        AND "status" NOT IN ('PAID', 'RECEIVED', 'CANCELLED')
        AND "supplier_name" IS NOT NULL
      GROUP BY "supplier_name"
      ORDER BY total DESC
      LIMIT ${limit}`;

    return results.map((r) => ({
      name: r.name,
      total:
        r.total !== null && r.total !== undefined
          ? Number(parseFloat(String(r.total)).toFixed(2))
          : 0,
      count: Number(r.count),
      oldestDueDate: r.oldestDueDate,
    }));
  }

  async findCategoryFrequencyBySupplier(
    tenantId: string,
    supplierName: string,
  ): Promise<CategoryFrequency[]> {
    const searchTerm = `%${supplierName}%`;

    const results = await prisma.$queryRaw<
      { categoryId: string; categoryName: string; count: bigint }[]
    >`
      SELECT e."category_id" as "categoryId", c."name" as "categoryName", COUNT(*) as count
      FROM "finance_entries" e
      JOIN "finance_categories" c ON c."id" = e."category_id"
      WHERE e."tenant_id" = ${tenantId}
        AND e."deleted_at" IS NULL
        AND (e."supplier_name" ILIKE ${searchTerm} OR e."customer_name" ILIKE ${searchTerm})
      GROUP BY e."category_id", c."name"
      ORDER BY count DESC
      LIMIT 3`;

    return results.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      count: Number(r.count),
    }));
  }

  async findCategoryFrequencyByKeywords(
    tenantId: string,
    keywords: string[],
  ): Promise<CategoryFrequency[]> {
    if (keywords.length === 0) return [];

    const searchPatterns = keywords.map((k) => `%${k}%`);

    const conditions = Prisma.join(
      searchPatterns.map(
        (pattern) =>
          Prisma.sql`(e."description" ILIKE ${pattern} OR e."notes" ILIKE ${pattern})`,
      ),
      ' OR ',
    );

    const results = await prisma.$queryRaw<
      { categoryId: string; categoryName: string; count: bigint }[]
    >`
      SELECT e."category_id" as "categoryId", c."name" as "categoryName", COUNT(*) as count
      FROM "finance_entries" e
      JOIN "finance_categories" c ON c."id" = e."category_id"
      WHERE e."tenant_id" = ${tenantId}
        AND e."deleted_at" IS NULL
        AND (${conditions})
      GROUP BY e."category_id", c."name"
      ORDER BY count DESC
      LIMIT 3`;

    return results.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      count: Number(r.count),
    }));
  }
}

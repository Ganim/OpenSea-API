import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankReconciliation } from '@/entities/finance/bank-reconciliation';
import type { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import { prisma } from '@/lib/prisma';
import {
  bankReconciliationPrismaToDomain,
  bankReconciliationItemPrismaToDomain,
} from '@/mappers/finance/bank-reconciliation/bank-reconciliation-prisma-to-domain';
import type { TransactionClient } from '@/lib/transaction-manager';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  ReconciliationStatus,
  ReconciliationMatchStatus,
} from '@prisma/generated/client.js';
import type {
  BankReconciliationsRepository,
  CreateBankReconciliationSchema,
  CreateBankReconciliationItemSchema,
  UpdateBankReconciliationSchema,
  UpdateBankReconciliationItemSchema,
  FindManyReconciliationsOptions,
  FindManyReconciliationsResult,
} from '../bank-reconciliations-repository';

export class PrismaBankReconciliationsRepository
  implements BankReconciliationsRepository
{
  async create(
    data: CreateBankReconciliationSchema,
    tx?: TransactionClient,
  ): Promise<BankReconciliation> {
    const db = tx ?? prisma;

    const reconciliation = await db.bankReconciliation.create({
      data: {
        tenantId: data.tenantId,
        bankAccountId: data.bankAccountId,
        fileName: data.fileName,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        totalTransactions: data.totalTransactions,
        matchedCount: data.matchedCount ?? 0,
        unmatchedCount: data.unmatchedCount ?? 0,
        status: (data.status as ReconciliationStatus) ?? 'PENDING',
      },
    });

    return bankReconciliationPrismaToDomain(reconciliation);
  }

  async createItems(
    itemSchemas: CreateBankReconciliationItemSchema[],
    tx?: TransactionClient,
  ): Promise<BankReconciliationItem[]> {
    const db = tx ?? prisma;

    // Create items in batch
    await db.bankReconciliationItem.createMany({
      data: itemSchemas.map((itemData) => ({
        reconciliationId: itemData.reconciliationId,
        fitId: itemData.fitId,
        transactionDate: itemData.transactionDate,
        amount: itemData.amount,
        description: itemData.description,
        type: itemData.type,
        matchedEntryId: itemData.matchedEntryId ?? null,
        matchConfidence: itemData.matchConfidence ?? null,
        matchStatus:
          (itemData.matchStatus as ReconciliationMatchStatus) ?? 'UNMATCHED',
      })),
    });

    // Fetch created items
    const createdItems = await db.bankReconciliationItem.findMany({
      where: {
        reconciliationId: itemSchemas[0]?.reconciliationId,
      },
      orderBy: { transactionDate: 'asc' },
    });

    return createdItems.map(bankReconciliationItemPrismaToDomain);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
    includeItems?: boolean,
  ): Promise<BankReconciliation | null> {
    const reconciliation = await prisma.bankReconciliation.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
      include: {
        items: includeItems ?? false,
      },
    });

    if (!reconciliation) return null;

    return bankReconciliationPrismaToDomain(reconciliation);
  }

  async findMany(
    options: FindManyReconciliationsOptions,
  ): Promise<FindManyReconciliationsResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const where: Prisma.BankReconciliationWhereInput = {
      tenantId: options.tenantId,
    };

    if (options.bankAccountId) {
      where.bankAccountId = options.bankAccountId;
    }
    if (options.status) {
      where.status = options.status as ReconciliationStatus;
    }
    if (options.dateFrom || options.dateTo) {
      where.importDate = {
        ...(options.dateFrom && { gte: options.dateFrom }),
        ...(options.dateTo && { lte: options.dateTo }),
      };
    }

    // P1-38: honor the sortBy/sortOrder pair from the controller. The
    // schema-level enum keeps the whitelist (createdAt | periodStart | status)
    // so we can safely build the orderBy object from runtime input.
    const sortField = options.sortBy ?? 'importDate';
    const orderBy: Prisma.BankReconciliationOrderByWithRelationInput = {
      [sortField]: options.sortOrder ?? 'desc',
    };

    const [reconciliations, total] = await Promise.all([
      prisma.bankReconciliation.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bankReconciliation.count({ where }),
    ]);

    return {
      reconciliations: reconciliations.map(bankReconciliationPrismaToDomain),
      total,
    };
  }

  async findItemById(
    itemId: UniqueEntityID,
    reconciliationId: string,
  ): Promise<BankReconciliationItem | null> {
    const item = await prisma.bankReconciliationItem.findFirst({
      where: {
        id: itemId.toString(),
        reconciliationId,
      },
    });

    if (!item) return null;

    return bankReconciliationItemPrismaToDomain(item);
  }

  async update(
    data: UpdateBankReconciliationSchema,
    tx?: TransactionClient,
  ): Promise<BankReconciliation | null> {
    const db = tx ?? prisma;

    // updateMany expects scalar-only updates; use UncheckedUpdateMany variant.
    const updateData: Prisma.BankReconciliationUncheckedUpdateManyInput = {};
    if (data.matchedCount !== undefined)
      updateData.matchedCount = data.matchedCount;
    if (data.unmatchedCount !== undefined)
      updateData.unmatchedCount = data.unmatchedCount;
    if (data.status !== undefined)
      updateData.status = data.status as ReconciliationStatus;

    // Multi-tenant guard: updateMany scoped by tenantId so a caller from
    // tenant A cannot modify a reconciliation belonging to tenant B even
    // if they discover its UUID.
    const result = await db.bankReconciliation.updateMany({
      where: { id: data.id.toString(), tenantId: data.tenantId },
      data: updateData,
    });

    if (result.count === 0) return null;

    const reconciliation = await db.bankReconciliation.findUnique({
      where: { id: data.id.toString() },
    });

    return reconciliation ? bankReconciliationPrismaToDomain(reconciliation) : null;
  }

  async updateItem(
    data: UpdateBankReconciliationItemSchema,
    tx?: TransactionClient,
  ): Promise<BankReconciliationItem | null> {
    const db = tx ?? prisma;

    // Use Unchecked* because updateMany works with scalar fields (no relation
    // connect/disconnect). This keeps \`matchedEntryId\` as a straightforward
    // foreign-key write.
    const updateData: Prisma.BankReconciliationItemUncheckedUpdateManyInput = {};
    if (data.matchedEntryId !== undefined)
      updateData.matchedEntryId = data.matchedEntryId;
    if (data.matchConfidence !== undefined)
      updateData.matchConfidence = data.matchConfidence;
    if (data.matchStatus !== undefined)
      updateData.matchStatus = data.matchStatus as ReconciliationMatchStatus;

    // Multi-tenant guard via parent reconciliation. The item itself does not
    // carry tenantId, so we scope by reconciliation.tenantId via a nested
    // where clause on updateMany.
    const result = await db.bankReconciliationItem.updateMany({
      where: {
        id: data.id.toString(),
        reconciliation: { tenantId: data.tenantId },
      },
      data: updateData,
    });

    if (result.count === 0) return null;

    const item = await db.bankReconciliationItem.findUnique({
      where: { id: data.id.toString() },
    });

    return item ? bankReconciliationItemPrismaToDomain(item) : null;
  }
}

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReconciliationSuggestion } from '@/entities/finance/reconciliation-suggestion';
import { prisma } from '@/lib/prisma';
import { reconciliationSuggestionPrismaToDomain } from '@/mappers/finance/reconciliation-suggestion/reconciliation-suggestion-prisma-to-domain';
import type { TransactionClient } from '@/lib/transaction-manager';
import type {
  ReconciliationSuggestionsRepository,
  CreateReconciliationSuggestionSchema,
  FindManySuggestionsOptions,
  FindManySuggestionsResult,
} from '../reconciliation-suggestions-repository';

export class PrismaReconciliationSuggestionsRepository
  implements ReconciliationSuggestionsRepository
{
  async create(
    data: CreateReconciliationSuggestionSchema,
    tx?: TransactionClient,
  ): Promise<ReconciliationSuggestion> {
    const db = tx ?? prisma;

    const suggestion = await db.reconciliationSuggestion.create({
      data: {
        tenantId: data.tenantId,
        transactionId: data.transactionId,
        entryId: data.entryId,
        score: data.score,
        matchReasons: data.matchReasons,
        status:
          (data.status as 'PENDING' | 'ACCEPTED' | 'REJECTED') ?? 'PENDING',
      },
    });

    return reconciliationSuggestionPrismaToDomain(suggestion);
  }

  async createMany(
    dataList: CreateReconciliationSuggestionSchema[],
    tx?: TransactionClient,
  ): Promise<number> {
    const db = tx ?? prisma;

    const result = await db.reconciliationSuggestion.createMany({
      data: dataList.map((d) => ({
        tenantId: d.tenantId,
        transactionId: d.transactionId,
        entryId: d.entryId,
        score: d.score,
        matchReasons: d.matchReasons,
        status: (d.status as 'PENDING' | 'ACCEPTED' | 'REJECTED') ?? 'PENDING',
      })),
    });

    return result.count;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ReconciliationSuggestion | null> {
    const suggestion = await prisma.reconciliationSuggestion.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!suggestion) return null;

    return reconciliationSuggestionPrismaToDomain(suggestion);
  }

  async findMany(
    options: FindManySuggestionsOptions,
  ): Promise<FindManySuggestionsResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const where: Record<string, unknown> = {
      tenantId: options.tenantId,
    };

    if (options.status) {
      where.status = options.status;
    }

    if (options.reconciliationId) {
      where.transaction = {
        reconciliationId: options.reconciliationId,
      };
    }

    const [suggestions, total] = await Promise.all([
      prisma.reconciliationSuggestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reconciliationSuggestion.count({ where }),
    ]);

    return {
      suggestions: suggestions.map(reconciliationSuggestionPrismaToDomain),
      total,
    };
  }

  async findByTransactionId(
    transactionId: string,
    tenantId: string,
  ): Promise<ReconciliationSuggestion[]> {
    const suggestions = await prisma.reconciliationSuggestion.findMany({
      where: {
        transactionId,
        tenantId,
      },
      orderBy: { score: 'desc' },
    });

    return suggestions.map(reconciliationSuggestionPrismaToDomain);
  }

  async updateStatus(
    id: UniqueEntityID,
    status: string,
    reviewedBy: string,
    tx?: TransactionClient,
  ): Promise<ReconciliationSuggestion | null> {
    const db = tx ?? prisma;

    const suggestion = await db.reconciliationSuggestion.update({
      where: { id: id.toString() },
      data: {
        status: status as 'PENDING' | 'ACCEPTED' | 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy,
      },
    });

    return reconciliationSuggestionPrismaToDomain(suggestion);
  }

  async deleteByTransactionId(
    transactionId: string,
    tx?: TransactionClient,
  ): Promise<void> {
    const db = tx ?? prisma;

    await db.reconciliationSuggestion.deleteMany({
      where: { transactionId },
    });
  }
}

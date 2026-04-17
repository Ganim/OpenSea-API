import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BankReconciliation } from '@/entities/finance/bank-reconciliation';
import { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import type {
  BankReconciliationsRepository,
  CreateBankReconciliationSchema,
  CreateBankReconciliationItemSchema,
  UpdateBankReconciliationSchema,
  UpdateBankReconciliationItemSchema,
  FindManyReconciliationsOptions,
  FindManyReconciliationsResult,
} from '../bank-reconciliations-repository';

export class InMemoryBankReconciliationsRepository
  implements BankReconciliationsRepository
{
  public reconciliations: BankReconciliation[] = [];
  public items: BankReconciliationItem[] = [];

  async create(
    data: CreateBankReconciliationSchema,
  ): Promise<BankReconciliation> {
    const reconciliation = BankReconciliation.create({
      tenantId: new UniqueEntityID(data.tenantId),
      bankAccountId: new UniqueEntityID(data.bankAccountId),
      fileName: data.fileName,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      totalTransactions: data.totalTransactions,
      matchedCount: data.matchedCount ?? 0,
      unmatchedCount: data.unmatchedCount ?? 0,
      status: (data.status as BankReconciliation['status']) ?? 'PENDING',
    });

    this.reconciliations.push(reconciliation);
    return reconciliation;
  }

  async createItems(
    itemSchemas: CreateBankReconciliationItemSchema[],
  ): Promise<BankReconciliationItem[]> {
    const createdItems: BankReconciliationItem[] = [];

    for (const itemData of itemSchemas) {
      const item = BankReconciliationItem.create({
        reconciliationId: new UniqueEntityID(itemData.reconciliationId),
        fitId: itemData.fitId,
        transactionDate: itemData.transactionDate,
        amount: itemData.amount,
        description: itemData.description,
        type: itemData.type as 'DEBIT' | 'CREDIT',
        matchedEntryId: itemData.matchedEntryId
          ? new UniqueEntityID(itemData.matchedEntryId)
          : undefined,
        matchConfidence: itemData.matchConfidence ?? undefined,
        matchStatus:
          (itemData.matchStatus as BankReconciliationItem['matchStatus']) ??
          'UNMATCHED',
      });

      this.items.push(item);
      createdItems.push(item);
    }

    return createdItems;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
    includeItems?: boolean,
  ): Promise<BankReconciliation | null> {
    const reconciliation = this.reconciliations.find(
      (r) => r.id.equals(id) && r.tenantId.toString() === tenantId,
    );

    if (!reconciliation) return null;

    if (includeItems) {
      const relatedItems = this.items.filter(
        (i) => i.reconciliationId.toString() === reconciliation.id.toString(),
      );
      // Return a new instance with items
      return BankReconciliation.create(
        {
          ...reconciliation.props,
          items: relatedItems,
        },
        reconciliation.id,
      );
    }

    return reconciliation;
  }

  async findMany(
    options: FindManyReconciliationsOptions,
  ): Promise<FindManyReconciliationsResult> {
    let filtered = this.reconciliations.filter(
      (r) => r.tenantId.toString() === options.tenantId,
    );

    if (options.bankAccountId) {
      filtered = filtered.filter(
        (r) => r.bankAccountId.toString() === options.bankAccountId,
      );
    }

    if (options.status) {
      filtered = filtered.filter((r) => r.status === options.status);
    }

    if (options.dateFrom) {
      filtered = filtered.filter((r) => r.importDate >= options.dateFrom!);
    }

    if (options.dateTo) {
      filtered = filtered.filter((r) => r.importDate <= options.dateTo!);
    }

    const total = filtered.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const paged = filtered.slice(startIndex, startIndex + limit);

    return { reconciliations: paged, total };
  }

  async findItemById(
    itemId: UniqueEntityID,
    reconciliationId: string,
  ): Promise<BankReconciliationItem | null> {
    const item = this.items.find(
      (i) =>
        i.id.equals(itemId) &&
        i.reconciliationId.toString() === reconciliationId,
    );
    return item ?? null;
  }

  async update(
    data: UpdateBankReconciliationSchema,
  ): Promise<BankReconciliation | null> {
    const reconciliation = this.reconciliations.find(
      (r) => r.id.equals(data.id) && r.tenantId.toString() === data.tenantId,
    );

    if (!reconciliation) return null;

    if (data.matchedCount !== undefined)
      reconciliation.matchedCount = data.matchedCount;
    if (data.unmatchedCount !== undefined)
      reconciliation.unmatchedCount = data.unmatchedCount;
    if (data.status !== undefined)
      reconciliation.status = data.status as BankReconciliation['status'];

    return reconciliation;
  }

  async updateItem(
    data: UpdateBankReconciliationItemSchema,
  ): Promise<BankReconciliationItem | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    // Multi-tenant guard: confirm parent reconciliation belongs to caller's tenant
    const parent = this.reconciliations.find((r) =>
      r.id.equals(item.reconciliationId),
    );
    if (!parent || parent.tenantId.toString() !== data.tenantId) return null;

    if (data.matchStatus === 'MANUAL_MATCHED' && data.matchedEntryId) {
      item.manualMatch(new UniqueEntityID(data.matchedEntryId));
    } else if (data.matchStatus === 'AUTO_MATCHED' && data.matchedEntryId) {
      item.autoMatch(
        new UniqueEntityID(data.matchedEntryId),
        data.matchConfidence ?? 0,
      );
    } else if (data.matchStatus === 'IGNORED') {
      item.ignore();
    } else if (data.matchStatus === 'CREATED' && data.matchedEntryId) {
      item.markAsCreated(new UniqueEntityID(data.matchedEntryId));
    }

    return item;
  }
}

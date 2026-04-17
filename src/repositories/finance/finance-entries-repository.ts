import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import type {
  FinanceEntryStatus,
  FinanceEntryType,
  RecurrenceType,
  RecurrenceUnit,
} from '@/entities/finance/finance-entry-types';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateFinanceEntrySchema {
  tenantId: string;
  type: FinanceEntryType;
  code: string;
  description: string;
  notes?: string;
  categoryId: string;
  chartOfAccountId?: string;
  companyId?: string;
  costCenterId?: string;
  bankAccountId?: string;
  supplierName?: string;
  customerName?: string;
  supplierId?: string;
  customerId?: string;
  salesOrderId?: string;
  expectedAmount: number;
  actualAmount?: number;
  discount?: number;
  interest?: number;
  penalty?: number;
  issueDate: Date;
  dueDate: Date;
  competenceDate?: Date;
  paymentDate?: Date;
  status?: FinanceEntryStatus;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
  totalInstallments?: number;
  currentInstallment?: number;
  parentEntryId?: string;
  contractId?: string;
  fiscalDocumentId?: string;
  boletoBarcode?: string;
  boletoDigitLine?: string;
  boletoChargeId?: number;
  boletoBarcodeNumber?: string;
  boletoDigitableLine?: string;
  boletoPdfUrl?: string;
  beneficiaryName?: string;
  beneficiaryCpfCnpj?: string;
  pixKey?: string;
  pixKeyType?: string;
  pixChargeId?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  createdBy?: string;
}

export interface UpdateFinanceEntrySchema {
  id: UniqueEntityID;
  tenantId: string;
  description?: string;
  notes?: string | null;
  categoryId?: string;
  costCenterId?: string;
  bankAccountId?: string | null;
  supplierName?: string | null;
  customerName?: string | null;
  expectedAmount?: number;
  discount?: number;
  interest?: number;
  penalty?: number;
  dueDate?: Date;
  competenceDate?: Date | null;
  status?: FinanceEntryStatus;
  actualAmount?: number;
  paymentDate?: Date;
  boletoBarcode?: string | null;
  boletoDigitLine?: string | null;
  boletoChargeId?: number | null;
  boletoBarcodeNumber?: string | null;
  boletoDigitableLine?: string | null;
  boletoPdfUrl?: string | null;
  beneficiaryName?: string | null;
  beneficiaryCpfCnpj?: string | null;
  pixKey?: string | null;
  pixKeyType?: string | null;
  pixChargeId?: string | null;
  fiscalDocumentId?: string | null;
  tags?: string[];
}

export interface FindManyFinanceEntriesOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  sortBy?:
    | 'createdAt'
    | 'dueDate'
    | 'expectedAmount'
    | 'description'
    | 'status';
  sortOrder?: 'asc' | 'desc';
  type?: string;
  status?: string;
  /**
   * Excludes entries whose status is in this list. Useful for rules that
   * need to filter out CANCELLED entries when counting recurrence or
   * historical activity.
   */
  statusNotIn?: string[];
  categoryId?: string;
  companyId?: string;
  costCenterId?: string;
  bankAccountId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  competenceDateFrom?: Date;
  competenceDateTo?: Date;
  competenceDateFallbackToIssueDate?: boolean;
  isOverdue?: boolean;
  customerName?: string;
  supplierName?: string;
  overdueRange?: string; // '1-7' | '8-30' | '31-60' | '60+'
  parentEntryId?: string;
  contractId?: string;
  search?: string;
  createdByUserId?: string;
  /**
   * P1-35: Filter by soft-deletion status.
   *   - undefined/false → only active entries (default legacy behavior)
   *   - true → both active and soft-deleted entries
   *   - 'only' → only soft-deleted entries (recycle-bin view)
   */
  includeDeleted?: boolean | 'only';
}

export interface FindManyResult {
  entries: FinanceEntry[];
  total: number;
}

// Aggregation result types
export interface DateRangeSum {
  date: string;
  total: number;
}

export interface CategorySum {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface CostCenterSum {
  costCenterId: string;
  costCenterName: string;
  total: number;
}

export interface OverdueSum {
  total: number;
  count: number;
}

export interface OverdueByParty {
  name: string;
  total: number;
  count: number;
  oldestDueDate: Date;
}

export interface CategoryFrequency {
  categoryId: string;
  categoryName: string;
  count: number;
}

export interface FinanceEntriesRepository {
  create(
    data: CreateFinanceEntrySchema,
    tx?: TransactionClient,
  ): Promise<FinanceEntry>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<FinanceEntry | null>;
  /**
   * SELECT ... FOR UPDATE — acquires a row-level lock inside a transaction.
   * Prevents concurrent payments from reading stale sums.
   */
  findByIdForUpdate(
    id: UniqueEntityID,
    tenantId: string,
    tx: TransactionClient,
  ): Promise<FinanceEntry | null>;
  findByCode(code: string, tenantId: string): Promise<FinanceEntry | null>;
  /**
   * P3-01: Locate a FinanceEntry by any of its boleto identifier fields
   * (barcode, barcodeNumber, digitLine or digitableLine) scoped to the
   * tenant and to the owning bank account. Replaces the O(N) in-memory
   * scan the CNAB return pipeline used to perform against the full paged
   * list of entries.
   *
   * Returns the first entry whose *plaintext* boleto identifier matches.
   * Implementations that store boleto fields encrypted at rest must
   * decrypt on a bounded candidate set.
   */
  findByBoletoIdentifiers(
    tenantId: string,
    bankAccountId: string,
    boletoIdentifier: string,
  ): Promise<FinanceEntry | null>;
  findMany(
    options: FindManyFinanceEntriesOptions,
    tx?: TransactionClient,
  ): Promise<FindManyResult>;
  update(
    data: UpdateFinanceEntrySchema,
    tx?: TransactionClient,
  ): Promise<FinanceEntry | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  generateNextCode(
    tenantId: string,
    type: string,
    tx?: TransactionClient,
  ): Promise<string>;

  // Aggregation queries
  sumByDateRange(
    tenantId: string,
    type: string | undefined,
    from: Date,
    to: Date,
    groupBy: 'day' | 'week' | 'month',
    /**
     * Optional whitelist of statuses to include. When omitted (undefined)
     * the query keeps the historical behavior of returning every status,
     * but P0-09 callers (cashflow / predictive / balance-sheet) should
     * pass at least `['PENDING','PARTIALLY_PAID','OVERDUE']` to exclude
     * cancelled and already-settled entries from forward-looking totals.
     */
    statusIn?: string[],
  ): Promise<DateRangeSum[]>;
  sumByCategory(
    tenantId: string,
    type: string | undefined,
    from: Date,
    to: Date,
  ): Promise<CategorySum[]>;
  sumByCostCenter(
    tenantId: string,
    type: string | undefined,
    from: Date,
    to: Date,
  ): Promise<CostCenterSum[]>;
  countByStatus(
    tenantId: string,
    type?: string,
  ): Promise<Record<string, number>>;
  sumOverdue(tenantId: string, type: string): Promise<OverdueSum>;
  topOverdueByCustomer(
    tenantId: string,
    limit?: number,
  ): Promise<OverdueByParty[]>;
  topOverdueBySupplier(
    tenantId: string,
    limit?: number,
  ): Promise<OverdueByParty[]>;

  // Category suggestion queries
  findCategoryFrequencyBySupplier(
    tenantId: string,
    supplierName: string,
  ): Promise<CategoryFrequency[]>;
  findCategoryFrequencyByKeywords(
    tenantId: string,
    keywords: string[],
  ): Promise<CategoryFrequency[]>;
}

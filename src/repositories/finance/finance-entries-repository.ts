import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntry } from '@/entities/finance/finance-entry';

export interface CreateFinanceEntrySchema {
  tenantId: string;
  type: string;
  code: string;
  description: string;
  notes?: string;
  categoryId: string;
  costCenterId: string;
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
  status?: string;
  recurrenceType?: string;
  recurrenceInterval?: number;
  recurrenceUnit?: string;
  totalInstallments?: number;
  currentInstallment?: number;
  parentEntryId?: string;
  boletoBarcode?: string;
  boletoDigitLine?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  createdBy?: string;
}

export interface UpdateFinanceEntrySchema {
  id: UniqueEntityID;
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
  status?: string;
  actualAmount?: number;
  paymentDate?: Date;
  boletoBarcode?: string | null;
  boletoDigitLine?: string | null;
  tags?: string[];
}

export interface FindManyFinanceEntriesOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  categoryId?: string;
  costCenterId?: string;
  bankAccountId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  isOverdue?: boolean;
  customerName?: string;
  supplierName?: string;
  overdueRange?: string; // '1-7' | '8-30' | '31-60' | '60+'
  parentEntryId?: string;
  search?: string;
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

export interface FinanceEntriesRepository {
  create(data: CreateFinanceEntrySchema): Promise<FinanceEntry>;
  findById(id: UniqueEntityID, tenantId: string): Promise<FinanceEntry | null>;
  findByCode(code: string, tenantId: string): Promise<FinanceEntry | null>;
  findMany(options: FindManyFinanceEntriesOptions): Promise<FindManyResult>;
  update(data: UpdateFinanceEntrySchema): Promise<FinanceEntry | null>;
  delete(id: UniqueEntityID): Promise<void>;
  generateNextCode(tenantId: string, type: string): Promise<string>;

  // Aggregation queries
  sumByDateRange(tenantId: string, type: string | undefined, from: Date, to: Date, groupBy: 'day' | 'week' | 'month'): Promise<DateRangeSum[]>;
  sumByCategory(tenantId: string, type: string | undefined, from: Date, to: Date): Promise<CategorySum[]>;
  sumByCostCenter(tenantId: string, type: string | undefined, from: Date, to: Date): Promise<CostCenterSum[]>;
  countByStatus(tenantId: string, type?: string): Promise<Record<string, number>>;
  sumOverdue(tenantId: string, type: string): Promise<OverdueSum>;
  topOverdueByCustomer(tenantId: string, limit?: number): Promise<OverdueByParty[]>;
  topOverdueBySupplier(tenantId: string, limit?: number): Promise<OverdueByParty[]>;
}

import type { RecurringConfig } from '@/entities/finance/recurring-config';

export interface CreateRecurringConfigSchema {
  tenantId: string;
  type: string;
  description: string;
  categoryId: string;
  costCenterId?: string;
  bankAccountId?: string;
  supplierName?: string;
  customerName?: string;
  supplierId?: string;
  customerId?: string;
  expectedAmount: number;
  isVariable?: boolean;
  frequencyUnit: string;
  frequencyInterval?: number;
  startDate: Date;
  endDate?: Date;
  totalOccurrences?: number;
  nextDueDate?: Date;
  interestRate?: number;
  penaltyRate?: number;
  indexationType?: string;
  fixedAdjustmentRate?: number;
  lastAdjustmentDate?: Date;
  adjustmentMonth?: number;
  notes?: string;
  createdBy?: string;
}

export interface UpdateRecurringConfigSchema {
  id: string;
  tenantId: string;
  description?: string;
  expectedAmount?: number;
  frequencyUnit?: string;
  frequencyInterval?: number;
  endDate?: Date | null;
  totalOccurrences?: number | null;
  interestRate?: number | null;
  penaltyRate?: number | null;
  indexationType?: string | null;
  fixedAdjustmentRate?: number | null;
  lastAdjustmentDate?: Date | null;
  adjustmentMonth?: number | null;
  notes?: string | null;
  status?: string;
  generatedCount?: number;
  lastGeneratedDate?: Date;
  nextDueDate?: Date | null;
  bankAccountId?: string | null;
  costCenterId?: string | null;
}

export interface FindManyRecurringConfigsOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'description' | 'baseAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
  type?: string;
  status?: string;
  search?: string;
}

export interface FindManyRecurringConfigsResult {
  configs: RecurringConfig[];
  total: number;
}

export interface RecurringConfigsRepository {
  create(data: CreateRecurringConfigSchema): Promise<RecurringConfig>;
  findById(id: string, tenantId: string): Promise<RecurringConfig | null>;
  findMany(
    options: FindManyRecurringConfigsOptions,
  ): Promise<FindManyRecurringConfigsResult>;
  findActiveForGeneration(
    endDate: Date,
    tenantId: string,
  ): Promise<RecurringConfig[]>;
  update(data: UpdateRecurringConfigSchema): Promise<RecurringConfig | null>;
  delete(id: string, tenantId: string): Promise<void>;
}

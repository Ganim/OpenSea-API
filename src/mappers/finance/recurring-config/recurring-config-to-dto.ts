import type { RecurringConfig } from '@/entities/finance/recurring-config';

export interface RecurringConfigDTO {
  id: string;
  tenantId: string;
  type: string;
  status: string;
  description: string;
  categoryId: string;
  costCenterId?: string;
  bankAccountId?: string;
  supplierName?: string;
  customerName?: string;
  supplierId?: string;
  customerId?: string;
  expectedAmount: number;
  isVariable: boolean;
  frequencyUnit: string;
  frequencyInterval: number;
  startDate: Date;
  endDate?: Date;
  totalOccurrences?: number;
  generatedCount: number;
  lastGeneratedDate?: Date;
  nextDueDate?: Date;
  interestRate?: number;
  penaltyRate?: number;
  indexationType?: string;
  fixedAdjustmentRate?: number;
  lastAdjustmentDate?: Date;
  adjustmentMonth?: number;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function recurringConfigToDTO(
  config: RecurringConfig,
): RecurringConfigDTO {
  return {
    id: config.id.toString(),
    tenantId: config.tenantId.toString(),
    type: config.type,
    status: config.status,
    description: config.description,
    categoryId: config.categoryId.toString(),
    costCenterId: config.costCenterId?.toString(),
    bankAccountId: config.bankAccountId?.toString(),
    supplierName: config.supplierName,
    customerName: config.customerName,
    supplierId: config.supplierId,
    customerId: config.customerId,
    expectedAmount: config.expectedAmount,
    isVariable: config.isVariable,
    frequencyUnit: config.frequencyUnit,
    frequencyInterval: config.frequencyInterval,
    startDate: config.startDate,
    endDate: config.endDate,
    totalOccurrences: config.totalOccurrences,
    generatedCount: config.generatedCount,
    lastGeneratedDate: config.lastGeneratedDate,
    nextDueDate: config.nextDueDate,
    interestRate: config.interestRate,
    penaltyRate: config.penaltyRate,
    indexationType: config.indexationType,
    fixedAdjustmentRate: config.fixedAdjustmentRate,
    lastAdjustmentDate: config.lastAdjustmentDate,
    adjustmentMonth: config.adjustmentMonth,
    notes: config.notes,
    createdBy: config.createdBy,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    deletedAt: config.deletedAt,
  };
}

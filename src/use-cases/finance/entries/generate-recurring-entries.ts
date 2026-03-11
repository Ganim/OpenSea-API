import type {
  FinanceEntryType,
  RecurrenceUnit,
} from '@/entities/finance/finance-entry-types';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import { calculateNextDate } from '@/utils/finance/calculate-next-date';

interface GenerateRecurringEntriesUseCaseRequest {
  tenantId: string;
  parentEntryId: string;
  type: FinanceEntryType;
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
  issueDate: Date;
  dueDate: Date;
  competenceDate?: Date;
  recurrenceInterval: number;
  recurrenceUnit: RecurrenceUnit;
  totalInstallments: number;
  boletoBarcode?: string;
  boletoDigitLine?: string;
  tags?: string[];
  createdBy?: string;
}

interface GenerateRecurringEntriesUseCaseResponse {
  entries: FinanceEntryDTO[];
}

export class GenerateRecurringEntriesUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: GenerateRecurringEntriesUseCaseRequest,
  ): Promise<GenerateRecurringEntriesUseCaseResponse> {
    const entries: FinanceEntryDTO[] = [];

    for (let i = 1; i <= request.totalInstallments; i++) {
      const installmentDueDate = calculateNextDate(
        request.dueDate,
        request.recurrenceInterval,
        request.recurrenceUnit,
        i - 1,
      );

      const code = await this.financeEntriesRepository.generateNextCode(
        request.tenantId,
        request.type,
      );

      const entry = await this.financeEntriesRepository.create({
        tenantId: request.tenantId,
        type: request.type,
        code,
        description: `${request.description} (${i}/${request.totalInstallments})`,
        notes: request.notes,
        categoryId: request.categoryId,
        costCenterId: request.costCenterId,
        bankAccountId: request.bankAccountId,
        supplierName: request.supplierName,
        customerName: request.customerName,
        supplierId: request.supplierId,
        customerId: request.customerId,
        salesOrderId: request.salesOrderId,
        expectedAmount: request.expectedAmount / request.totalInstallments,
        issueDate: request.issueDate,
        dueDate: installmentDueDate,
        competenceDate: request.competenceDate,
        recurrenceType: 'INSTALLMENT',
        recurrenceInterval: request.recurrenceInterval,
        recurrenceUnit: request.recurrenceUnit,
        totalInstallments: request.totalInstallments,
        currentInstallment: i,
        parentEntryId: request.parentEntryId,
        boletoBarcode: request.boletoBarcode,
        boletoDigitLine: request.boletoDigitLine,
        tags: request.tags,
        createdBy: request.createdBy,
      });

      entries.push(financeEntryToDTO(entry));
    }

    return { entries };
  }
}

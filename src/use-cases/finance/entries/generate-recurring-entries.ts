import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';

interface GenerateRecurringEntriesUseCaseRequest {
  tenantId: string;
  parentEntryId: string;
  type: string;
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
  recurrenceUnit: string;
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
      const installmentDueDate = this.calculateNextDate(
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

  private calculateNextDate(
    baseDate: Date,
    interval: number,
    unit: string,
    multiplier: number,
  ): Date {
    const date = new Date(baseDate);
    const totalInterval = interval * multiplier;

    switch (unit) {
      case 'DAILY':
        date.setUTCDate(date.getUTCDate() + totalInterval);
        break;
      case 'WEEKLY':
        date.setUTCDate(date.getUTCDate() + totalInterval * 7);
        break;
      case 'BIWEEKLY':
        date.setUTCDate(date.getUTCDate() + totalInterval * 14);
        break;
      case 'MONTHLY':
        date.setUTCMonth(date.getUTCMonth() + totalInterval);
        break;
      case 'QUARTERLY':
        date.setUTCMonth(date.getUTCMonth() + totalInterval * 3);
        break;
      case 'SEMIANNUAL':
        date.setUTCMonth(date.getUTCMonth() + totalInterval * 6);
        break;
      case 'ANNUAL':
        date.setUTCFullYear(date.getUTCFullYear() + totalInterval);
        break;
    }

    return date;
  }
}

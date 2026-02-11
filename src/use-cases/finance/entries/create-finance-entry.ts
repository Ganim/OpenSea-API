import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface CreateFinanceEntryUseCaseRequest {
  tenantId: string;
  type: string; // 'PAYABLE' | 'RECEIVABLE'
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
  discount?: number;
  interest?: number;
  penalty?: number;
  issueDate: Date;
  dueDate: Date;
  competenceDate?: Date;
  recurrenceType?: string;
  recurrenceInterval?: number;
  recurrenceUnit?: string;
  totalInstallments?: number;
  currentInstallment?: number;
  boletoBarcode?: string;
  boletoDigitLine?: string;
  tags?: string[];
  createdBy?: string;
}

interface CreateFinanceEntryUseCaseResponse {
  entry: FinanceEntryDTO;
  installments?: FinanceEntryDTO[];
}

export class CreateFinanceEntryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private categoriesRepository: FinanceCategoriesRepository,
    private costCentersRepository: CostCentersRepository,
  ) {}

  async execute(
    request: CreateFinanceEntryUseCaseRequest,
  ): Promise<CreateFinanceEntryUseCaseResponse> {
    const {
      tenantId,
      type,
      description,
      categoryId,
      costCenterId,
      expectedAmount,
    } = request;

    if (!description || description.trim().length === 0) {
      throw new BadRequestError('Description is required');
    }

    if (type !== 'PAYABLE' && type !== 'RECEIVABLE') {
      throw new BadRequestError('Type must be PAYABLE or RECEIVABLE');
    }

    if (expectedAmount <= 0) {
      throw new BadRequestError('Expected amount must be positive');
    }

    // Validate category exists
    const category = await this.categoriesRepository.findById(
      new UniqueEntityID(categoryId),
      tenantId,
    );
    if (!category) {
      throw new BadRequestError('Category not found');
    }

    // Validate cost center exists
    const costCenter = await this.costCentersRepository.findById(
      new UniqueEntityID(costCenterId),
      tenantId,
    );
    if (!costCenter) {
      throw new BadRequestError('Cost center not found');
    }

    // Generate auto code
    const code = await this.financeEntriesRepository.generateNextCode(
      tenantId,
      type,
    );

    // Validate recurrence fields
    if (request.recurrenceType === 'INSTALLMENT') {
      if (!request.totalInstallments || request.totalInstallments < 2) {
        throw new BadRequestError(
          'Installments require at least 2 installments',
        );
      }
      if (!request.recurrenceInterval || !request.recurrenceUnit) {
        throw new BadRequestError(
          'Recurrence interval and unit are required for installments',
        );
      }
    }

    if (request.recurrenceType === 'RECURRING') {
      if (!request.recurrenceInterval || !request.recurrenceUnit) {
        throw new BadRequestError(
          'Recurrence interval and unit are required for recurring entries',
        );
      }
    }

    const entry = await this.financeEntriesRepository.create({
      tenantId,
      type,
      code,
      description: description.trim(),
      notes: request.notes,
      categoryId,
      costCenterId,
      bankAccountId: request.bankAccountId,
      supplierName: request.supplierName,
      customerName: request.customerName,
      supplierId: request.supplierId,
      customerId: request.customerId,
      salesOrderId: request.salesOrderId,
      expectedAmount,
      discount: request.discount,
      interest: request.interest,
      penalty: request.penalty,
      issueDate: request.issueDate,
      dueDate: request.dueDate,
      competenceDate: request.competenceDate,
      recurrenceType: request.recurrenceType,
      recurrenceInterval: request.recurrenceInterval,
      recurrenceUnit: request.recurrenceUnit,
      totalInstallments: request.totalInstallments,
      currentInstallment: request.currentInstallment,
      boletoBarcode: request.boletoBarcode,
      boletoDigitLine: request.boletoDigitLine,
      tags: request.tags,
      createdBy: request.createdBy,
    });

    // Generate installment child entries
    if (request.recurrenceType === 'INSTALLMENT') {
      const installments = await this.generateInstallments(
        request,
        entry.id.toString(),
      );
      return { entry: financeEntryToDTO(entry), installments };
    }

    // Generate first occurrence for recurring entries
    if (request.recurrenceType === 'RECURRING') {
      const firstOccurrence = await this.generateFirstOccurrence(
        request,
        entry.id.toString(),
      );
      return {
        entry: financeEntryToDTO(entry),
        installments: [firstOccurrence],
      };
    }

    return { entry: financeEntryToDTO(entry) };
  }

  private async generateInstallments(
    request: CreateFinanceEntryUseCaseRequest,
    parentEntryId: string,
  ): Promise<FinanceEntryDTO[]> {
    const installments: FinanceEntryDTO[] = [];
    const installmentAmount =
      request.expectedAmount / request.totalInstallments!;

    for (let i = 1; i <= request.totalInstallments!; i++) {
      const installmentDueDate = this.calculateNextDate(
        request.dueDate,
        request.recurrenceInterval!,
        request.recurrenceUnit!,
        i - 1,
      );

      const installmentCode =
        await this.financeEntriesRepository.generateNextCode(
          request.tenantId,
          request.type,
        );

      const installmentEntry = await this.financeEntriesRepository.create({
        tenantId: request.tenantId,
        type: request.type,
        code: installmentCode,
        description: `${request.description.trim()} (${i}/${request.totalInstallments})`,
        notes: request.notes,
        categoryId: request.categoryId,
        costCenterId: request.costCenterId,
        bankAccountId: request.bankAccountId,
        supplierName: request.supplierName,
        customerName: request.customerName,
        supplierId: request.supplierId,
        customerId: request.customerId,
        salesOrderId: request.salesOrderId,
        expectedAmount: installmentAmount,
        issueDate: request.issueDate,
        dueDate: installmentDueDate,
        competenceDate: request.competenceDate,
        recurrenceType: 'INSTALLMENT',
        recurrenceInterval: request.recurrenceInterval,
        recurrenceUnit: request.recurrenceUnit,
        totalInstallments: request.totalInstallments,
        currentInstallment: i,
        parentEntryId,
        boletoBarcode: request.boletoBarcode,
        boletoDigitLine: request.boletoDigitLine,
        tags: request.tags,
        createdBy: request.createdBy,
      });

      installments.push(financeEntryToDTO(installmentEntry));
    }

    return installments;
  }

  private async generateFirstOccurrence(
    request: CreateFinanceEntryUseCaseRequest,
    parentEntryId: string,
  ): Promise<FinanceEntryDTO> {
    const occurrenceCode = await this.financeEntriesRepository.generateNextCode(
      request.tenantId,
      request.type,
    );

    const occurrence = await this.financeEntriesRepository.create({
      tenantId: request.tenantId,
      type: request.type,
      code: occurrenceCode,
      description: `${request.description.trim()} (1)`,
      notes: request.notes,
      categoryId: request.categoryId,
      costCenterId: request.costCenterId,
      bankAccountId: request.bankAccountId,
      supplierName: request.supplierName,
      customerName: request.customerName,
      supplierId: request.supplierId,
      customerId: request.customerId,
      salesOrderId: request.salesOrderId,
      expectedAmount: request.expectedAmount,
      issueDate: request.issueDate,
      dueDate: request.dueDate,
      competenceDate: request.competenceDate,
      recurrenceType: 'RECURRING',
      recurrenceInterval: request.recurrenceInterval,
      recurrenceUnit: request.recurrenceUnit,
      currentInstallment: 1,
      parentEntryId,
      tags: request.tags,
      createdBy: request.createdBy,
    });

    return financeEntryToDTO(occurrence);
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

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
    const { tenantId, type, description, categoryId, costCenterId, expectedAmount } = request;

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
    const code = await this.financeEntriesRepository.generateNextCode(tenantId, type);

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

    return { entry: financeEntryToDTO(entry) };
  }
}

import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  FinanceEntryType,
  RecurrenceType,
  RecurrenceUnit,
} from '@/entities/finance/finance-entry-types';
import { logger } from '@/lib/logger';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryCostCentersRepository } from '@/repositories/finance/finance-entry-cost-centers-repository';
import type { FinanceApprovalRulesRepository } from '@/repositories/finance/finance-approval-rules-repository';
import type { FinanceEntryRetentionsRepository } from '@/repositories/finance/finance-entry-retentions-repository';
import type { CalendarSyncService } from '@/services/calendar/calendar-sync.service';
import {
  type RetentionConfig,
  type RetentionSummary,
  calculateAllRetentions,
} from '@/services/finance/tax-calculation.service';
import { calculateNextDate } from '@/utils/finance/calculate-next-date';
import {
  assertPeriodNotLocked,
  type PeriodLockChecker,
} from '@/utils/finance/period-lock-guard';

interface CostCenterAllocation {
  costCenterId: string;
  percentage: number;
}

interface CreateFinanceEntryUseCaseRequest {
  tenantId: string;
  type: FinanceEntryType;
  description: string;
  notes?: string;
  categoryId: string;
  chartOfAccountId?: string;
  costCenterId?: string;
  costCenterAllocations?: CostCenterAllocation[];
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
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
  totalInstallments?: number;
  currentInstallment?: number;
  boletoBarcode?: string;
  boletoDigitLine?: string;
  beneficiaryName?: string;
  beneficiaryCpfCnpj?: string;
  pixKey?: string;
  pixKeyType?: string;
  tags?: string[];
  createdBy?: string;
  applyRetentions?: boolean;
  retentionConfig?: RetentionConfig;
}

interface CreateFinanceEntryUseCaseResponse {
  entry: FinanceEntryDTO;
  installments?: FinanceEntryDTO[];
  retentionSummary?: RetentionSummary;
}

export class CreateFinanceEntryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private categoriesRepository: FinanceCategoriesRepository,
    private costCentersRepository: CostCentersRepository,
    private calendarSyncService?: CalendarSyncService,
    private transactionManager?: TransactionManager,
    private costCenterAllocationsRepository?: FinanceEntryCostCentersRepository,
    private approvalRulesRepository?: FinanceApprovalRulesRepository,
    private evaluateAutoApproval?: (
      entryId: string,
      tenantId: string,
      createdBy?: string,
    ) => Promise<void>,
    private retentionsRepository?: FinanceEntryRetentionsRepository,
    private autoJournalFromEntry?: {
      execute(req: {
        tenantId: string;
        entryId: string;
        createdBy?: string;
      }): Promise<unknown>;
    },
    private periodLockChecker?: PeriodLockChecker,
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
      costCenterAllocations,
      expectedAmount,
    } = request;

    if (!description || description.trim().length === 0) {
      throw new BadRequestError('Description is required');
    }

    await assertPeriodNotLocked(
      tenantId,
      request.dueDate,
      this.periodLockChecker,
    );

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

    // Validate category type compatibility with entry type
    if (category.type === 'REVENUE' && type === 'PAYABLE') {
      throw new BadRequestError(
        'Categoria do tipo RECEITA não pode ser usada em lançamentos a pagar',
      );
    }
    if (category.type === 'EXPENSE' && type === 'RECEIVABLE') {
      throw new BadRequestError(
        'Categoria do tipo DESPESA não pode ser usada em lançamentos a receber',
      );
    }

    // Validate cost center assignment: must have costCenterId XOR costCenterAllocations
    if (
      costCenterId &&
      costCenterAllocations &&
      costCenterAllocations.length > 0
    ) {
      throw new BadRequestError(
        'Cannot provide both costCenterId and costCenterAllocations',
        ErrorCodes.FINANCE_RATEIO_CONFLICT,
      );
    }

    if (
      !costCenterId &&
      (!costCenterAllocations || costCenterAllocations.length === 0)
    ) {
      throw new BadRequestError(
        'Must provide either costCenterId or costCenterAllocations',
        ErrorCodes.FINANCE_RATEIO_CONFLICT,
      );
    }

    // Validate single cost center
    if (costCenterId) {
      const costCenter = await this.costCentersRepository.findById(
        new UniqueEntityID(costCenterId),
        tenantId,
      );
      if (!costCenter) {
        throw new BadRequestError('Cost center not found');
      }
    }

    // Validate rateio allocations
    if (costCenterAllocations && costCenterAllocations.length > 0) {
      const sum = costCenterAllocations.reduce(
        (acc, a) => acc + a.percentage,
        0,
      );
      const roundedSum = Math.round(sum * 100) / 100;
      if (Math.abs(roundedSum - 100) > 0.001) {
        throw new BadRequestError(
          'Alocações de centro de custo devem somar exatamente 100%',
          ErrorCodes.FINANCE_RATEIO_INVALID_PERCENTAGE,
        );
      }

      // Validate all referenced cost centers exist
      for (const allocation of costCenterAllocations) {
        const cc = await this.costCentersRepository.findById(
          new UniqueEntityID(allocation.costCenterId),
          tenantId,
        );
        if (!cc) {
          throw new BadRequestError('Cost center not found');
        }
      }
    }

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

    // Default competenceDate to issueDate if not provided
    if (!request.competenceDate) {
      request.competenceDate = request.issueDate;
    }

    // Normalize tags: trim, lowercase, remove blanks, deduplicate
    if (request.tags) {
      request.tags = [
        ...new Set(
          request.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
        ),
      ];
    }

    // Use transaction when we have rateio or installments/recurring
    const needsTransaction =
      (costCenterAllocations && costCenterAllocations.length > 0) ||
      request.recurrenceType === 'INSTALLMENT' ||
      request.recurrenceType === 'RECURRING';

    if (this.transactionManager && needsTransaction) {
      return this.transactionManager.run(async (tx) => {
        return this.createWithChildren(request, tx);
      });
    }

    // Simple entry (no children, no rateio) — no transaction needed
    return this.createWithChildren(request);
  }

  private async createWithChildren(
    request: CreateFinanceEntryUseCaseRequest,
    tx?: TransactionClient,
  ): Promise<CreateFinanceEntryUseCaseResponse> {
    const { tenantId, type, description, expectedAmount } = request;

    const code = await this.financeEntriesRepository.generateNextCode(
      tenantId,
      type,
      tx,
    );

    // When using rateio, costCenterId on the entry is null
    const entryCostCenterId = request.costCenterAllocations?.length
      ? undefined
      : request.costCenterId;

    const entry = await this.financeEntriesRepository.create(
      {
        tenantId,
        type,
        code,
        description: description.trim(),
        notes: request.notes,
        categoryId: request.categoryId,
        chartOfAccountId: request.chartOfAccountId,
        costCenterId: entryCostCenterId,
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
        beneficiaryName: request.beneficiaryName,
        beneficiaryCpfCnpj: request.beneficiaryCpfCnpj,
        pixKey: request.pixKey,
        pixKeyType: request.pixKeyType,
        tags: request.tags,
        createdBy: request.createdBy,
      },
      tx,
    );

    // Create cost center allocations if rateio is used
    if (
      request.costCenterAllocations?.length &&
      this.costCenterAllocationsRepository
    ) {
      const allocations = this.calculateAllocations(
        request.costCenterAllocations,
        expectedAmount,
        entry.id.toString(),
      );
      await this.costCenterAllocationsRepository.createMany(allocations, tx);
    }

    // Calendar sync is non-blocking and happens OUTSIDE the transaction
    if (
      !request.recurrenceType &&
      this.calendarSyncService &&
      request.dueDate > new Date()
    ) {
      this.syncToCalendar(
        tenantId,
        entry.id.toString(),
        type,
        description.trim(),
        request.dueDate,
        request.createdBy ?? entry.id.toString(),
      );
    }

    // Generate installment child entries (within same transaction)
    if (request.recurrenceType === 'INSTALLMENT') {
      const installments = await this.generateInstallments(
        request,
        entry.id.toString(),
        tx,
      );
      return { entry: financeEntryToDTO(entry), installments };
    }

    // Generate first occurrence for recurring entries (within same transaction)
    if (request.recurrenceType === 'RECURRING') {
      const firstOccurrence = await this.generateFirstOccurrence(
        request,
        entry.id.toString(),
        tx,
      );
      return {
        entry: financeEntryToDTO(entry),
        installments: [firstOccurrence],
      };
    }

    // Auto-approval evaluation (fire-and-forget, outside transaction)
    if (this.evaluateAutoApproval) {
      this.evaluateAutoApproval(
        entry.id.toString(),
        tenantId,
        request.createdBy,
      ).catch(() => {});
    }

    // Apply tax retentions if requested (opt-in)
    let retentionSummary: RetentionSummary | undefined;
    if (
      request.applyRetentions &&
      request.retentionConfig &&
      this.retentionsRepository
    ) {
      const summary = calculateAllRetentions(
        expectedAmount,
        request.retentionConfig,
      );

      const toCreate = summary.retentions
        .filter((r) => r.amount > 0)
        .map((r) => ({
          tenantId,
          entryId: entry.id.toString(),
          taxType: r.taxType,
          grossAmount: r.grossAmount,
          rate: r.rate,
          amount: r.amount,
          withheld: false,
          description: r.description,
        }));

      if (toCreate.length > 0) {
        await this.retentionsRepository.createMany(toCreate, tx);
      }

      retentionSummary = summary;
    }

    // Generate journal entry (non-blocking)
    if (this.autoJournalFromEntry) {
      try {
        await this.autoJournalFromEntry.execute({
          tenantId: request.tenantId,
          entryId: entry.id.toString(),
          createdBy: request.createdBy,
        });
      } catch (err) {
        logger.warn(
          {
            err,
            context: 'CreateFinanceEntryUseCase.autoJournalFromEntry',
            entryId: entry.id.toString(),
            tenantId: request.tenantId,
          },
          'Journal generation failed after entry creation; entry persisted.',
        );
      }
    }

    return {
      entry: financeEntryToDTO(entry),
      ...(retentionSummary && { retentionSummary }),
    };
  }

  private calculateAllocations(
    allocations: CostCenterAllocation[],
    totalAmount: number,
    entryId: string,
  ): {
    entryId: string;
    costCenterId: string;
    percentage: number;
    amount: number;
  }[] {
    const result: {
      entryId: string;
      costCenterId: string;
      percentage: number;
      amount: number;
    }[] = [];
    let allocatedSum = 0;

    for (let i = 0; i < allocations.length; i++) {
      const alloc = allocations[i];
      let amount: number;

      if (i === allocations.length - 1) {
        // Last item gets the remainder to avoid rounding issues
        amount = Math.round((totalAmount - allocatedSum) * 100) / 100;
      } else {
        amount = Math.round((alloc.percentage / 100) * totalAmount * 100) / 100;
        allocatedSum += amount;
      }

      result.push({
        entryId,
        costCenterId: alloc.costCenterId,
        percentage: alloc.percentage,
        amount,
      });
    }

    return result;
  }

  private async generateInstallments(
    request: CreateFinanceEntryUseCaseRequest,
    parentEntryId: string,
    tx?: TransactionClient,
  ): Promise<FinanceEntryDTO[]> {
    const installments: FinanceEntryDTO[] = [];
    const installmentAmount =
      request.expectedAmount / request.totalInstallments!;

    // When using rateio, costCenterId on each installment is null
    const installmentCostCenterId = request.costCenterAllocations?.length
      ? undefined
      : request.costCenterId;

    for (let i = 1; i <= request.totalInstallments!; i++) {
      const installmentDueDate = calculateNextDate(
        request.dueDate,
        request.recurrenceInterval!,
        request.recurrenceUnit!,
        i - 1,
      );

      const installmentCode =
        await this.financeEntriesRepository.generateNextCode(
          request.tenantId,
          request.type,
          tx,
        );

      const installmentEntry = await this.financeEntriesRepository.create(
        {
          tenantId: request.tenantId,
          type: request.type,
          code: installmentCode,
          description: `${request.description.trim()} (${i}/${request.totalInstallments})`,
          notes: request.notes,
          categoryId: request.categoryId,
          costCenterId: installmentCostCenterId,
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
          beneficiaryName: request.beneficiaryName,
          beneficiaryCpfCnpj: request.beneficiaryCpfCnpj,
          pixKey: request.pixKey,
          pixKeyType: request.pixKeyType,
          tags: request.tags,
          createdBy: request.createdBy,
        },
        tx,
      );

      // Create cost center allocations for each installment if rateio is used
      if (
        request.costCenterAllocations?.length &&
        this.costCenterAllocationsRepository
      ) {
        const childAllocations = this.calculateAllocations(
          request.costCenterAllocations,
          installmentAmount,
          installmentEntry.id.toString(),
        );
        await this.costCenterAllocationsRepository.createMany(
          childAllocations,
          tx,
        );
      }

      // Calendar sync is fire-and-forget, outside transaction
      if (this.calendarSyncService && installmentDueDate > new Date()) {
        this.syncToCalendar(
          request.tenantId,
          installmentEntry.id.toString(),
          request.type,
          `${request.description.trim()} (${i}/${request.totalInstallments})`,
          installmentDueDate,
          request.createdBy ?? installmentEntry.id.toString(),
        );
      }

      installments.push(financeEntryToDTO(installmentEntry));
    }

    return installments;
  }

  private async generateFirstOccurrence(
    request: CreateFinanceEntryUseCaseRequest,
    parentEntryId: string,
    tx?: TransactionClient,
  ): Promise<FinanceEntryDTO> {
    const occurrenceCode = await this.financeEntriesRepository.generateNextCode(
      request.tenantId,
      request.type,
      tx,
    );

    const occurrence = await this.financeEntriesRepository.create(
      {
        tenantId: request.tenantId,
        type: request.type,
        code: occurrenceCode,
        description: `${request.description.trim()} (1)`,
        notes: request.notes,
        categoryId: request.categoryId,
        costCenterId: request.costCenterAllocations?.length
          ? undefined
          : request.costCenterId,
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
        beneficiaryName: request.beneficiaryName,
        beneficiaryCpfCnpj: request.beneficiaryCpfCnpj,
        pixKey: request.pixKey,
        pixKeyType: request.pixKeyType,
        tags: request.tags,
        createdBy: request.createdBy,
      },
      tx,
    );

    // Calendar sync is fire-and-forget, outside transaction
    if (this.calendarSyncService && request.dueDate > new Date()) {
      this.syncToCalendar(
        request.tenantId,
        occurrence.id.toString(),
        request.type,
        `${request.description.trim()} (1)`,
        request.dueDate,
        request.createdBy ?? occurrence.id.toString(),
      );
    }

    return financeEntryToDTO(occurrence);
  }

  private syncToCalendar(
    tenantId: string,
    entryId: string,
    entryType: FinanceEntryType,
    description: string,
    dueDate: Date,
    userId: string,
  ): void {
    // Fire-and-forget — calendar sync must never block or rollback finance operations
    this.calendarSyncService
      ?.syncFinanceEntry({
        tenantId,
        entryId,
        entryType,
        description,
        dueDate,
        userId,
      })
      .catch(() => {});
  }
}

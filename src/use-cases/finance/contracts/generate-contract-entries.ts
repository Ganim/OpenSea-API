import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ContractsRepository } from '@/repositories/finance/contracts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface GenerateContractEntriesRequest {
  tenantId: string;
  contractId: string;
}

interface GenerateContractEntriesResponse {
  entriesCreated: number;
  totalEntries: number;
}

export class GenerateContractEntriesUseCase {
  constructor(
    private contractsRepository: ContractsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: GenerateContractEntriesRequest,
  ): Promise<GenerateContractEntriesResponse> {
    const { tenantId, contractId } = request;

    const contract = await this.contractsRepository.findById(
      new UniqueEntityID(contractId),
      tenantId,
    );

    if (!contract) {
      throw new ResourceNotFoundError('Contract not found');
    }

    if (contract.isCancelled) {
      throw new BadRequestError(
        'Cannot generate entries for cancelled contract',
      );
    }

    if (!contract.categoryId) {
      throw new BadRequestError(
        'Contract must have a category to generate entries',
      );
    }

    // Calculate payment dates from startDate to endDate
    const paymentDates = this.calculatePaymentDates(
      contract.startDate,
      contract.endDate,
      contract.paymentFrequency,
    );

    // Check existing entries for idempotency
    const existingEntries = await this.financeEntriesRepository.findMany({
      tenantId,
      contractId,
      limit: 1000,
    });

    const existingDueDates = new Set(
      existingEntries.entries.map((e) => e.dueDate.toISOString().split('T')[0]),
    );

    let entriesCreated = 0;

    for (const dueDate of paymentDates) {
      const dueDateKey = dueDate.toISOString().split('T')[0];

      // Idempotency check
      if (existingDueDates.has(dueDateKey)) {
        continue;
      }

      const code = await this.financeEntriesRepository.generateNextCode(
        tenantId,
        'PAYABLE',
      );

      await this.financeEntriesRepository.create({
        tenantId,
        type: 'PAYABLE',
        code,
        description: `${contract.title} - ${contract.companyName}`,
        categoryId: contract.categoryId,
        costCenterId: contract.costCenterId,
        bankAccountId: contract.bankAccountId,
        supplierName: contract.companyName,
        supplierId: contract.companyId,
        expectedAmount: contract.paymentAmount,
        issueDate: contract.startDate,
        dueDate,
        contractId,
        tags: ['contrato'],
        createdBy: contract.createdBy,
      });

      entriesCreated++;
    }

    return {
      entriesCreated,
      totalEntries: existingEntries.entries.length + entriesCreated,
    };
  }

  private calculatePaymentDates(
    startDate: Date,
    endDate: Date,
    frequency: string,
  ): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);

    // Move to first payment date (one period after start)
    this.advanceDate(current, frequency);

    while (current <= endDate) {
      dates.push(new Date(current));
      this.advanceDate(current, frequency);
    }

    return dates;
  }

  private advanceDate(date: Date, frequency: string): void {
    switch (frequency) {
      case 'DAILY':
        date.setUTCDate(date.getUTCDate() + 1);
        break;
      case 'WEEKLY':
        date.setUTCDate(date.getUTCDate() + 7);
        break;
      case 'BIWEEKLY':
        date.setUTCDate(date.getUTCDate() + 14);
        break;
      case 'MONTHLY':
        date.setUTCMonth(date.getUTCMonth() + 1);
        break;
      case 'QUARTERLY':
        date.setUTCMonth(date.getUTCMonth() + 3);
        break;
      case 'SEMIANNUAL':
        date.setUTCMonth(date.getUTCMonth() + 6);
        break;
      case 'ANNUAL':
        date.setUTCFullYear(date.getUTCFullYear() + 1);
        break;
      default:
        date.setUTCMonth(date.getUTCMonth() + 1);
    }
  }
}

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';
import type { ConsortiaRepository } from '@/repositories/finance/consortia-repository';
import type { ConsortiumPaymentsRepository } from '@/repositories/finance/consortium-payments-repository';

interface LinkPaymentsToEntriesRequest {
  tenantId: string;
  consortiumId: string;
  categoryId: string;
}

interface LinkPaymentsToEntriesResponse {
  entriesCreated: number;
}

export class LinkPaymentsToEntriesUseCase {
  constructor(
    private consortiaRepository: ConsortiaRepository,
    private consortiumPaymentsRepository: ConsortiumPaymentsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private categoriesRepository: FinanceCategoriesRepository,
    private costCentersRepository: CostCentersRepository,
  ) {}

  async execute(
    request: LinkPaymentsToEntriesRequest,
  ): Promise<LinkPaymentsToEntriesResponse> {
    const { tenantId, consortiumId, categoryId } = request;

    // Validate consortium exists
    const consortium = await this.consortiaRepository.findById(
      new UniqueEntityID(consortiumId),
      tenantId,
    );
    if (!consortium) {
      throw new ResourceNotFoundError('Consortium not found');
    }

    // Fetch all payments for this consortium
    const payments = await this.consortiumPaymentsRepository.findByConsortiumId(
      new UniqueEntityID(consortiumId),
    );

    // Get existing entries to check for already-linked payments (idempotency)
    const existingEntries = await this.financeEntriesRepository.findMany({
      tenantId,
      type: 'PAYABLE',
      limit: 1000,
    });

    // Build a set of descriptions that already exist to detect linked payments
    const existingDescriptions = new Set(
      existingEntries.entries.map((e) => e.description),
    );

    let entriesCreated = 0;

    for (const payment of payments) {
      if (payment.status === 'PAID') continue;

      const description = `Parcela ${payment.installmentNumber}/${consortium.totalInstallments} - ${consortium.name}`;

      // Skip if already linked (idempotent)
      if (existingDescriptions.has(description)) continue;

      const code = await this.financeEntriesRepository.generateNextCode(
        tenantId,
        'PAYABLE',
      );

      await this.financeEntriesRepository.create({
        tenantId,
        type: 'PAYABLE',
        code,
        description,
        categoryId,
        costCenterId: consortium.costCenterId.toString(),
        bankAccountId: consortium.bankAccountId.toString(),
        expectedAmount: payment.expectedAmount,
        issueDate: new Date(),
        dueDate: payment.dueDate,
      });

      entriesCreated++;
    }

    return { entriesCreated };
  }
}

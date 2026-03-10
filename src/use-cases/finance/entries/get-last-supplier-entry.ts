import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface GetLastSupplierEntryUseCaseRequest {
  tenantId: string;
  supplierName: string;
}

export interface SupplierEntrySuggestion {
  categoryId: string;
  costCenterId?: string;
}

export class GetLastSupplierEntryUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: GetLastSupplierEntryUseCaseRequest,
  ): Promise<SupplierEntrySuggestion | null> {
    const { tenantId, supplierName } = request;

    if (!supplierName || supplierName.trim().length === 0) {
      return null;
    }

    // Fetch recent entries for this supplier, then sort by createdAt DESC
    const { entries } = await this.financeEntriesRepository.findMany({
      tenantId,
      supplierName,
      page: 1,
      limit: 50,
    });

    if (entries.length === 0) {
      return null;
    }

    // Sort by issueDate descending (then createdAt) to get the most recent entry
    const sorted = [...entries].sort((a, b) => {
      const dateDiff = b.issueDate.getTime() - a.issueDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const lastEntry = sorted[0];

    return {
      categoryId: lastEntry.categoryId.toString(),
      costCenterId: lastEntry.costCenterId?.toString(),
    };
  }
}

import {
  type BankReconciliationDTO,
  bankReconciliationToDTO,
} from '@/mappers/finance/bank-reconciliation/bank-reconciliation-to-dto';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';

interface ListReconciliationsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  bankAccountId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  // P1-38: forwarded from the controller after schema validation.
  sortBy?: 'createdAt' | 'periodStart' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface ListReconciliationsUseCaseResponse {
  reconciliations: BankReconciliationDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListReconciliationsUseCase {
  constructor(
    private bankReconciliationsRepository: BankReconciliationsRepository,
  ) {}

  async execute(
    request: ListReconciliationsUseCaseRequest,
  ): Promise<ListReconciliationsUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const { reconciliations, total } =
      await this.bankReconciliationsRepository.findMany({
        tenantId: request.tenantId,
        page,
        limit,
        bankAccountId: request.bankAccountId,
        status: request.status,
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      });

    return {
      reconciliations: reconciliations.map(bankReconciliationToDTO),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

import { type LoanDTO, loanToDTO } from '@/mappers/finance/loan/loan-to-dto';
import type { LoansRepository } from '@/repositories/finance/loans-repository';

interface ListLoansUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'principalAmount' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc';
  bankAccountId?: string;
  costCenterId?: string;
  type?: string;
  status?: string;
  search?: string;
}

interface ListLoansUseCaseResponse {
  loans: LoanDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListLoansUseCase {
  constructor(private loansRepository: LoansRepository) {}

  async execute(
    request: ListLoansUseCaseRequest,
  ): Promise<ListLoansUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const { loans, total } = await this.loansRepository.findMany({
      tenantId: request.tenantId,
      page,
      limit,
      sortBy: request.sortBy,
      sortOrder: request.sortOrder,
      bankAccountId: request.bankAccountId,
      costCenterId: request.costCenterId,
      type: request.type,
      status: request.status,
      search: request.search,
    });

    return {
      loans: loans.map(loanToDTO),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

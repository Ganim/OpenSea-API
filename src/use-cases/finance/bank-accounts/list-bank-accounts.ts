import {
  type BankAccountDTO,
  bankAccountToDTO,
} from '@/mappers/finance/bank-account/bank-account-to-dto';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';

interface ListBankAccountsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  accountType?: string;
  status?: string;
  sortBy?: 'name' | 'bankName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface ListBankAccountsUseCaseResponse {
  bankAccounts: BankAccountDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListBankAccountsUseCase {
  constructor(private bankAccountsRepository: BankAccountsRepository) {}

  async execute(
    request: ListBankAccountsUseCaseRequest,
  ): Promise<ListBankAccountsUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const { bankAccounts, total } =
      await this.bankAccountsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page,
        limit,
        search: request.search,
        companyId: request.companyId,
        accountType: request.accountType,
        status: request.status,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      });

    return {
      bankAccounts: bankAccounts.map((ba) => bankAccountToDTO(ba)),
      meta: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

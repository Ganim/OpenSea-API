import {
  type BankAccountDTO,
  bankAccountToDTO,
} from '@/mappers/finance/bank-account/bank-account-to-dto';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';

interface ListBankAccountsUseCaseRequest {
  tenantId: string;
}

interface ListBankAccountsUseCaseResponse {
  bankAccounts: BankAccountDTO[];
}

export class ListBankAccountsUseCase {
  constructor(private bankAccountsRepository: BankAccountsRepository) {}

  async execute({
    tenantId,
  }: ListBankAccountsUseCaseRequest): Promise<ListBankAccountsUseCaseResponse> {
    const bankAccounts = await this.bankAccountsRepository.findMany(tenantId);
    return { bankAccounts: bankAccounts.map(bankAccountToDTO) };
  }
}

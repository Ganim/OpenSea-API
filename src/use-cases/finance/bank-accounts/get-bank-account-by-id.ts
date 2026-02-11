import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type BankAccountDTO,
  bankAccountToDTO,
} from '@/mappers/finance/bank-account/bank-account-to-dto';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';

interface GetBankAccountByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetBankAccountByIdUseCaseResponse {
  bankAccount: BankAccountDTO;
}

export class GetBankAccountByIdUseCase {
  constructor(private bankAccountsRepository: BankAccountsRepository) {}

  async execute({
    tenantId,
    id,
  }: GetBankAccountByIdUseCaseRequest): Promise<GetBankAccountByIdUseCaseResponse> {
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!bankAccount) {
      throw new ResourceNotFoundError('Bank account not found');
    }

    return { bankAccount: bankAccountToDTO(bankAccount) };
  }
}

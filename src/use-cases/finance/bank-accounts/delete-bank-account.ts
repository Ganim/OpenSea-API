import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';

interface DeleteBankAccountUseCaseRequest {
  tenantId: string;
  id: string;
}

export class DeleteBankAccountUseCase {
  constructor(private bankAccountsRepository: BankAccountsRepository) {}

  async execute({ tenantId, id }: DeleteBankAccountUseCaseRequest): Promise<void> {
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!bankAccount) {
      throw new ResourceNotFoundError('Bank account not found');
    }

    await this.bankAccountsRepository.delete(new UniqueEntityID(id));
  }
}

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LoansRepository } from '@/repositories/finance/loans-repository';

interface DeleteLoanUseCaseRequest {
  tenantId: string;
  id: string;
}

export class DeleteLoanUseCase {
  constructor(private loansRepository: LoansRepository) {}

  async execute({ tenantId, id }: DeleteLoanUseCaseRequest): Promise<void> {
    const loan = await this.loansRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!loan) {
      throw new ResourceNotFoundError('Loan not found');
    }

    await this.loansRepository.delete(new UniqueEntityID(id));
  }
}

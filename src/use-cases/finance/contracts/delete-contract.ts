import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ContractsRepository } from '@/repositories/finance/contracts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface DeleteContractUseCaseRequest {
  tenantId: string;
  contractId: string;
}

export class DeleteContractUseCase {
  constructor(
    private contractsRepository: ContractsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(request: DeleteContractUseCaseRequest): Promise<void> {
    const { tenantId, contractId } = request;

    const contract = await this.contractsRepository.findById(
      new UniqueEntityID(contractId),
      tenantId,
    );

    if (!contract) {
      throw new ResourceNotFoundError('Contract not found');
    }

    // Cancel all PENDING finance entries linked to this contract
    const linkedEntries = await this.financeEntriesRepository.findMany({
      tenantId,
      contractId,
      status: 'PENDING',
      limit: 1000,
    });

    for (const entry of linkedEntries.entries) {
      await this.financeEntriesRepository.update({
        id: entry.id,
        status: 'CANCELLED',
      });
    }

    // Soft delete the contract
    await this.contractsRepository.delete(
      new UniqueEntityID(contractId),
      tenantId,
    );
  }
}

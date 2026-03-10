import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type ContractDTO, contractToDTO } from '@/mappers/finance/contract/contract-to-dto';
import type { ContractsRepository } from '@/repositories/finance/contracts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface GetContractByIdUseCaseRequest {
  tenantId: string;
  contractId: string;
}

interface GetContractByIdUseCaseResponse {
  contract: ContractDTO;
  generatedEntriesCount: number;
  nextPaymentDate?: Date;
}

export class GetContractByIdUseCase {
  constructor(
    private contractsRepository: ContractsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: GetContractByIdUseCaseRequest,
  ): Promise<GetContractByIdUseCaseResponse> {
    const { tenantId, contractId } = request;

    const contract = await this.contractsRepository.findById(
      new UniqueEntityID(contractId),
      tenantId,
    );

    if (!contract) {
      throw new ResourceNotFoundError('Contract not found');
    }

    // Get generated entries for this contract
    const linkedEntries = await this.financeEntriesRepository.findMany({
      tenantId,
      contractId,
      limit: 1000,
    });

    // Find the next pending payment
    const now = new Date();
    const pendingEntries = linkedEntries.entries
      .filter((e) => ['PENDING', 'SCHEDULED'].includes(e.status) && e.dueDate >= now)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    const nextPaymentDate = pendingEntries.length > 0 ? pendingEntries[0].dueDate : undefined;

    return {
      contract: contractToDTO(contract),
      generatedEntriesCount: linkedEntries.entries.length,
      nextPaymentDate,
    };
  }
}

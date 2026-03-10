import { type ContractDTO, contractToDTO } from '@/mappers/finance/contract/contract-to-dto';
import type { ContractsRepository } from '@/repositories/finance/contracts-repository';

interface ListContractsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  status?: string;
  companyName?: string;
  search?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
}

interface ListContractsUseCaseResponse {
  contracts: ContractDTO[];
  total: number;
}

export class ListContractsUseCase {
  constructor(private contractsRepository: ContractsRepository) {}

  async execute(
    request: ListContractsUseCaseRequest,
  ): Promise<ListContractsUseCaseResponse> {
    const { contracts, total } = await this.contractsRepository.findMany({
      tenantId: request.tenantId,
      page: request.page,
      limit: request.limit,
      status: request.status,
      companyName: request.companyName,
      search: request.search,
      startDateFrom: request.startDateFrom,
      startDateTo: request.startDateTo,
      endDateFrom: request.endDateFrom,
      endDateTo: request.endDateTo,
    });

    return {
      contracts: contracts.map(contractToDTO),
      total,
    };
  }
}

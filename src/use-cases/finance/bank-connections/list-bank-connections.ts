import type {
  BankConnectionRecord,
  BankConnectionsRepository,
} from '@/repositories/finance/bank-connections-repository';

interface ListBankConnectionsUseCaseRequest {
  tenantId: string;
}

interface ListBankConnectionsUseCaseResponse {
  connections: BankConnectionRecord[];
}

export class ListBankConnectionsUseCase {
  constructor(
    private bankConnectionsRepository: BankConnectionsRepository,
  ) {}

  async execute(
    request: ListBankConnectionsUseCaseRequest,
  ): Promise<ListBankConnectionsUseCaseResponse> {
    const connections = await this.bankConnectionsRepository.findMany(
      request.tenantId,
    );

    return { connections };
  }
}

import type { BankingProvider } from '@/services/banking/pluggy-provider.interface';

interface GetConnectTokenUseCaseRequest {
  tenantId: string;
  userId: string;
}

interface GetConnectTokenUseCaseResponse {
  accessToken: string;
}

export class GetConnectTokenUseCase {
  constructor(private bankingProvider: BankingProvider) {}

  async execute(
    request: GetConnectTokenUseCaseRequest,
  ): Promise<GetConnectTokenUseCaseResponse> {
    const { tenantId, userId } = request;

    const result = await this.bankingProvider.createConnectToken({
      clientUserId: `${tenantId}:${userId}`,
    });

    return { accessToken: result.accessToken };
  }
}

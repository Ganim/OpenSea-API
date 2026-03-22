import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StoreCreditsRepository } from '@/repositories/sales/store-credits-repository';

interface GetBalanceUseCaseRequest {
  customerId: string;
  tenantId: string;
}

interface GetBalanceUseCaseResponse {
  balance: number;
}

export class GetBalanceUseCase {
  constructor(private storeCreditsRepository: StoreCreditsRepository) {}

  async execute(
    input: GetBalanceUseCaseRequest,
  ): Promise<GetBalanceUseCaseResponse> {
    const balance = await this.storeCreditsRepository.getBalance(
      new UniqueEntityID(input.customerId),
      input.tenantId,
    );

    return { balance };
  }
}

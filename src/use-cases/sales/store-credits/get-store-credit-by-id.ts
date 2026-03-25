import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StoreCredit } from '@/entities/sales/store-credit';
import type { StoreCreditsRepository } from '@/repositories/sales/store-credits-repository';

interface GetStoreCreditByIdUseCaseRequest {
  tenantId: string;
  storeCreditId: string;
}

interface GetStoreCreditByIdUseCaseResponse {
  storeCredit: StoreCredit;
}

export class GetStoreCreditByIdUseCase {
  constructor(private storeCreditsRepository: StoreCreditsRepository) {}

  async execute(
    request: GetStoreCreditByIdUseCaseRequest,
  ): Promise<GetStoreCreditByIdUseCaseResponse> {
    const storeCredit = await this.storeCreditsRepository.findById(
      new UniqueEntityID(request.storeCreditId),
      request.tenantId,
    );

    if (!storeCredit) {
      throw new ResourceNotFoundError('Store credit not found.');
    }

    return { storeCredit };
  }
}

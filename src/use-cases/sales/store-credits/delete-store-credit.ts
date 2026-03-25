import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StoreCredit } from '@/entities/sales/store-credit';
import type { StoreCreditsRepository } from '@/repositories/sales/store-credits-repository';

interface DeleteStoreCreditUseCaseRequest {
  tenantId: string;
  storeCreditId: string;
}

interface DeleteStoreCreditUseCaseResponse {
  deletedStoreCredit: StoreCredit;
}

export class DeleteStoreCreditUseCase {
  constructor(private storeCreditsRepository: StoreCreditsRepository) {}

  async execute(
    request: DeleteStoreCreditUseCaseRequest,
  ): Promise<DeleteStoreCreditUseCaseResponse> {
    const storeCreditId = new UniqueEntityID(request.storeCreditId);

    const storeCredit = await this.storeCreditsRepository.findById(
      storeCreditId,
      request.tenantId,
    );

    if (!storeCredit) {
      throw new ResourceNotFoundError('Store credit not found.');
    }

    await this.storeCreditsRepository.delete(storeCreditId, request.tenantId);

    return { deletedStoreCredit: storeCredit };
  }
}

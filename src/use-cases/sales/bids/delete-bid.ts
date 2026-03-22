import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidsRepository } from '@/repositories/sales/bids-repository';

interface DeleteBidUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteBidUseCase {
  constructor(private bidsRepository: BidsRepository) {}

  async execute(request: DeleteBidUseCaseRequest): Promise<void> {
    const bid = await this.bidsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!bid) {
      throw new ResourceNotFoundError('Bid not found');
    }

    await this.bidsRepository.delete(new UniqueEntityID(request.id), request.tenantId);
  }
}

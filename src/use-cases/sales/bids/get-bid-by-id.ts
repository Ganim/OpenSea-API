import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bid } from '@/entities/sales/bid';
import type { BidsRepository } from '@/repositories/sales/bids-repository';

interface GetBidByIdUseCaseRequest {
  id: string;
  tenantId: string;
}

interface GetBidByIdUseCaseResponse {
  bid: Bid;
}

export class GetBidByIdUseCase {
  constructor(private bidsRepository: BidsRepository) {}

  async execute(
    request: GetBidByIdUseCaseRequest,
  ): Promise<GetBidByIdUseCaseResponse> {
    const bid = await this.bidsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!bid) {
      throw new ResourceNotFoundError('Bid not found');
    }

    return { bid };
  }
}

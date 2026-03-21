import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deal } from '@/entities/sales/deal';
import type { DealsRepository } from '@/repositories/sales/deals-repository';

interface GetDealByIdUseCaseRequest {
  id: string;
  tenantId: string;
}

interface GetDealByIdUseCaseResponse {
  deal: Deal;
}

export class GetDealByIdUseCase {
  constructor(private dealsRepository: DealsRepository) {}

  async execute(
    request: GetDealByIdUseCaseRequest,
  ): Promise<GetDealByIdUseCaseResponse> {
    const deal = await this.dealsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!deal) {
      throw new ResourceNotFoundError('Deal not found');
    }

    return { deal };
  }
}

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deal } from '@/entities/sales/deal';
import type { DealsRepository } from '@/repositories/sales/deals-repository';

interface UpdateDealUseCaseRequest {
  id: string;
  tenantId: string;
  title?: string;
  value?: number;
  currency?: string;
  expectedCloseDate?: Date;
  probability?: number;
  lostReason?: string;
  assignedToUserId?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

interface UpdateDealUseCaseResponse {
  deal: Deal;
}

export class UpdateDealUseCase {
  constructor(private dealsRepository: DealsRepository) {}

  async execute(
    request: UpdateDealUseCaseRequest,
  ): Promise<UpdateDealUseCaseResponse> {
    const { id, tenantId, ...rest } = request;

    const deal = await this.dealsRepository.update({
      id: new UniqueEntityID(id),
      tenantId,
      title: rest.title,
      value: rest.value,
      currency: rest.currency,
      expectedCloseDate: rest.expectedCloseDate,
      probability: rest.probability,
      lostReason: rest.lostReason,
      assignedToUserId: rest.assignedToUserId,
      tags: rest.tags,
      customFields: rest.customFields,
    });

    if (!deal) {
      throw new ResourceNotFoundError('Deal not found');
    }

    return { deal };
  }
}

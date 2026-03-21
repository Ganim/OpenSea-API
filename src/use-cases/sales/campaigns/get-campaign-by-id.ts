import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Campaign } from '@/entities/sales/campaign';
import type { CampaignsRepository } from '@/repositories/sales/campaigns-repository';

interface GetCampaignByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetCampaignByIdUseCaseResponse {
  campaign: Campaign;
}

export class GetCampaignByIdUseCase {
  constructor(private campaignsRepository: CampaignsRepository) {}

  async execute(
    request: GetCampaignByIdUseCaseRequest,
  ): Promise<GetCampaignByIdUseCaseResponse> {
    const campaign = await this.campaignsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!campaign) {
      throw new ResourceNotFoundError('Campaign not found.');
    }

    return { campaign };
  }
}

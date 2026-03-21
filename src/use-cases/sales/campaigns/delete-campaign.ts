import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CampaignsRepository } from '@/repositories/sales/campaigns-repository';

interface DeleteCampaignUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteCampaignUseCaseResponse {
  message: string;
}

export class DeleteCampaignUseCase {
  constructor(private campaignsRepository: CampaignsRepository) {}

  async execute(
    request: DeleteCampaignUseCaseRequest,
  ): Promise<DeleteCampaignUseCaseResponse> {
    const campaign = await this.campaignsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!campaign) {
      throw new ResourceNotFoundError('Campaign not found.');
    }

    await this.campaignsRepository.delete(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    return { message: 'Campaign deleted successfully.' };
  }
}

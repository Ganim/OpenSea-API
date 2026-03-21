import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Campaign, CampaignStatus } from '@/entities/sales/campaign';
import type { CampaignsRepository } from '@/repositories/sales/campaigns-repository';

interface ActivateCampaignUseCaseRequest {
  tenantId: string;
  id: string;
  targetStatus: 'ACTIVE' | 'SCHEDULED';
}

interface ActivateCampaignUseCaseResponse {
  campaign: Campaign;
}

export class ActivateCampaignUseCase {
  constructor(private campaignsRepository: CampaignsRepository) {}

  async execute(
    request: ActivateCampaignUseCaseRequest,
  ): Promise<ActivateCampaignUseCaseResponse> {
    const existing = await this.campaignsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Campaign not found.');
    }

    const allowedTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      DRAFT: ['ACTIVE', 'SCHEDULED'],
      SCHEDULED: ['ACTIVE', 'PAUSED', 'ENDED'],
      ACTIVE: ['PAUSED', 'ENDED'],
      PAUSED: ['ACTIVE', 'ENDED'],
      ENDED: [],
    };

    const allowed = allowedTransitions[existing.status] ?? [];

    if (!allowed.includes(request.targetStatus)) {
      throw new BadRequestError(
        `Cannot transition campaign from ${existing.status} to ${request.targetStatus}.`,
      );
    }

    const campaign = await this.campaignsRepository.update({
      id: new UniqueEntityID(request.id),
      tenantId: request.tenantId,
      status: request.targetStatus,
    });

    if (!campaign) {
      throw new ResourceNotFoundError('Campaign not found.');
    }

    return { campaign };
  }
}

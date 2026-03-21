import type { Campaign, CampaignStatus } from '@/entities/sales/campaign';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { CampaignsRepository } from '@/repositories/sales/campaigns-repository';

interface ListCampaignsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  status?: CampaignStatus;
  search?: string;
}

interface ListCampaignsUseCaseResponse {
  campaigns: PaginatedResult<Campaign>;
}

export class ListCampaignsUseCase {
  constructor(private campaignsRepository: CampaignsRepository) {}

  async execute(
    request: ListCampaignsUseCaseRequest,
  ): Promise<ListCampaignsUseCaseResponse> {
    const campaigns = await this.campaignsRepository.findManyPaginated({
      tenantId: request.tenantId,
      page: request.page,
      limit: request.limit,
      status: request.status,
      search: request.search,
    });

    return { campaigns };
  }
}

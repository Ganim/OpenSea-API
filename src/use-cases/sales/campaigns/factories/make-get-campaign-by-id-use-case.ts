import { PrismaCampaignsRepository } from '@/repositories/sales/prisma/prisma-campaigns-repository';
import { GetCampaignByIdUseCase } from '../get-campaign-by-id';

export function makeGetCampaignByIdUseCase() {
  const campaignsRepository = new PrismaCampaignsRepository();
  return new GetCampaignByIdUseCase(campaignsRepository);
}

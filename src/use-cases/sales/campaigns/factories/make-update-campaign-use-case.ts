import { PrismaCampaignsRepository } from '@/repositories/sales/prisma/prisma-campaigns-repository';
import { UpdateCampaignUseCase } from '../update-campaign';

export function makeUpdateCampaignUseCase() {
  const campaignsRepository = new PrismaCampaignsRepository();
  return new UpdateCampaignUseCase(campaignsRepository);
}

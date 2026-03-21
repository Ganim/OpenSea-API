import { PrismaCampaignsRepository } from '@/repositories/sales/prisma/prisma-campaigns-repository';
import { CreateCampaignUseCase } from '../create-campaign';

export function makeCreateCampaignUseCase() {
  const campaignsRepository = new PrismaCampaignsRepository();
  return new CreateCampaignUseCase(campaignsRepository);
}

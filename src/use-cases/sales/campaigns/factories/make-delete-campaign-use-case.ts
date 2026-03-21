import { PrismaCampaignsRepository } from '@/repositories/sales/prisma/prisma-campaigns-repository';
import { DeleteCampaignUseCase } from '../delete-campaign';

export function makeDeleteCampaignUseCase() {
  const campaignsRepository = new PrismaCampaignsRepository();
  return new DeleteCampaignUseCase(campaignsRepository);
}

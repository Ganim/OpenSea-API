import { PrismaCampaignsRepository } from '@/repositories/sales/prisma/prisma-campaigns-repository';
import { ActivateCampaignUseCase } from '../activate-campaign';

export function makeActivateCampaignUseCase() {
  const campaignsRepository = new PrismaCampaignsRepository();
  return new ActivateCampaignUseCase(campaignsRepository);
}

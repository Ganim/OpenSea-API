import { PrismaCampaignsRepository } from '@/repositories/sales/prisma/prisma-campaigns-repository';
import { ListCampaignsUseCase } from '../list-campaigns';

export function makeListCampaignsUseCase() {
  const campaignsRepository = new PrismaCampaignsRepository();
  return new ListCampaignsUseCase(campaignsRepository);
}

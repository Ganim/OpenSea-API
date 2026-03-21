import { PrismaSupportSlaConfigsRepository } from '@/repositories/core/prisma/prisma-support-sla-configs-repository';
import { GetSlaConfigUseCase } from '../get-sla-config';

export function makeGetSlaConfigUseCase() {
  const supportSlaConfigsRepository = new PrismaSupportSlaConfigsRepository();
  return new GetSlaConfigUseCase(supportSlaConfigsRepository);
}

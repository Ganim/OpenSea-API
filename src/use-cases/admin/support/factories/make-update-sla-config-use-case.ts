import { PrismaSupportSlaConfigsRepository } from '@/repositories/core/prisma/prisma-support-sla-configs-repository';
import { UpdateSlaConfigUseCase } from '../update-sla-config';

export function makeUpdateSlaConfigUseCase() {
  const supportSlaConfigsRepository = new PrismaSupportSlaConfigsRepository();
  return new UpdateSlaConfigUseCase(supportSlaConfigsRepository);
}

import { PrismaDowntimeReasonsRepository } from '@/repositories/production/prisma/prisma-downtime-reasons-repository';
import { ListDowntimeReasonsUseCase } from '../list-downtime-reasons';

export function makeListDowntimeReasonsUseCase() {
  const downtimeReasonsRepository = new PrismaDowntimeReasonsRepository();
  return new ListDowntimeReasonsUseCase(downtimeReasonsRepository);
}

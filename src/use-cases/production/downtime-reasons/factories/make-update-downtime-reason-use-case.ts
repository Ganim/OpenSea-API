import { PrismaDowntimeReasonsRepository } from '@/repositories/production/prisma/prisma-downtime-reasons-repository';
import { UpdateDowntimeReasonUseCase } from '../update-downtime-reason';

export function makeUpdateDowntimeReasonUseCase() {
  const downtimeReasonsRepository = new PrismaDowntimeReasonsRepository();
  return new UpdateDowntimeReasonUseCase(downtimeReasonsRepository);
}

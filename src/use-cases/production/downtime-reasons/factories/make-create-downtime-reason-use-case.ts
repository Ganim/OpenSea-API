import { PrismaDowntimeReasonsRepository } from '@/repositories/production/prisma/prisma-downtime-reasons-repository';
import { CreateDowntimeReasonUseCase } from '../create-downtime-reason';

export function makeCreateDowntimeReasonUseCase() {
  const downtimeReasonsRepository = new PrismaDowntimeReasonsRepository();
  return new CreateDowntimeReasonUseCase(downtimeReasonsRepository);
}

import { PrismaDowntimeReasonsRepository } from '@/repositories/production/prisma/prisma-downtime-reasons-repository';
import { GetDowntimeReasonByIdUseCase } from '../get-downtime-reason-by-id';

export function makeGetDowntimeReasonByIdUseCase() {
  const downtimeReasonsRepository = new PrismaDowntimeReasonsRepository();
  return new GetDowntimeReasonByIdUseCase(downtimeReasonsRepository);
}

import { PrismaDowntimeReasonsRepository } from '@/repositories/production/prisma/prisma-downtime-reasons-repository';
import { DeleteDowntimeReasonUseCase } from '../delete-downtime-reason';

export function makeDeleteDowntimeReasonUseCase() {
  const downtimeReasonsRepository = new PrismaDowntimeReasonsRepository();
  return new DeleteDowntimeReasonUseCase(downtimeReasonsRepository);
}

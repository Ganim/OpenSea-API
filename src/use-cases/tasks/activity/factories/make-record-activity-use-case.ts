import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { RecordActivityUseCase } from '../record-activity';

export function makeRecordActivityUseCase() {
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new RecordActivityUseCase(cardActivitiesRepository);
}

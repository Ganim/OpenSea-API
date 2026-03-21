import { PrismaActivitiesRepository } from '@/repositories/sales/prisma/prisma-activities-repository';
import { DeleteActivityUseCase } from '@/use-cases/sales/activities/delete-activity';

export function makeDeleteActivityUseCase() {
  const activitiesRepository = new PrismaActivitiesRepository();

  return new DeleteActivityUseCase(activitiesRepository);
}

import { PrismaActivitiesRepository } from '@/repositories/sales/prisma/prisma-activities-repository';
import { GetActivityByIdUseCase } from '@/use-cases/sales/activities/get-activity-by-id';

export function makeGetActivityByIdUseCase() {
  const activitiesRepository = new PrismaActivitiesRepository();

  return new GetActivityByIdUseCase(activitiesRepository);
}

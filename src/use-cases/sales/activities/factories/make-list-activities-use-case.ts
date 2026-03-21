import { PrismaActivitiesRepository } from '@/repositories/sales/prisma/prisma-activities-repository';
import { ListActivitiesUseCase } from '@/use-cases/sales/activities/list-activities';

export function makeListActivitiesUseCase() {
  const activitiesRepository = new PrismaActivitiesRepository();

  return new ListActivitiesUseCase(activitiesRepository);
}

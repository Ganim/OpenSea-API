// TODO: Replace with Prisma repository when PrismaActivitiesRepository is created
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { ListActivitiesUseCase } from '@/use-cases/sales/activities/list-activities';

export function makeListActivitiesUseCase() {
  const activitiesRepository = new InMemoryActivitiesRepository();

  return new ListActivitiesUseCase(activitiesRepository);
}

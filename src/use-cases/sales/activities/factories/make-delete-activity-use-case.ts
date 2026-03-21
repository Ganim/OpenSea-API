// TODO: Replace with Prisma repository when PrismaActivitiesRepository is created
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { DeleteActivityUseCase } from '@/use-cases/sales/activities/delete-activity';

export function makeDeleteActivityUseCase() {
  const activitiesRepository = new InMemoryActivitiesRepository();

  return new DeleteActivityUseCase(activitiesRepository);
}

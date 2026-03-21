// TODO: Replace with Prisma repository when PrismaActivitiesRepository is created
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { CreateActivityUseCase } from '@/use-cases/sales/activities/create-activity';

export function makeCreateActivityUseCase() {
  const activitiesRepository = new InMemoryActivitiesRepository();

  return new CreateActivityUseCase(activitiesRepository);
}

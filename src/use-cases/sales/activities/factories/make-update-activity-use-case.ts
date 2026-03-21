// TODO: Replace with Prisma repository when PrismaActivitiesRepository is created
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { UpdateActivityUseCase } from '@/use-cases/sales/activities/update-activity';

export function makeUpdateActivityUseCase() {
  const activitiesRepository = new InMemoryActivitiesRepository();

  return new UpdateActivityUseCase(activitiesRepository);
}

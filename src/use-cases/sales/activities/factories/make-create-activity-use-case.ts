import { PrismaActivitiesRepository } from '@/repositories/sales/prisma/prisma-activities-repository';
import { PrismaTimelineEventsRepository } from '@/repositories/sales/prisma/prisma-timeline-events-repository';
import { CreateActivityUseCase } from '@/use-cases/sales/activities/create-activity';

export function makeCreateActivityUseCase() {
  const activitiesRepository = new PrismaActivitiesRepository();
  const timelineEventsRepository = new PrismaTimelineEventsRepository();

  return new CreateActivityUseCase(activitiesRepository, timelineEventsRepository);
}

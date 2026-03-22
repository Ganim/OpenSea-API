import { PrismaActivitiesRepository } from '@/repositories/sales/prisma/prisma-activities-repository';
import { PrismaTimelineEventsRepository } from '@/repositories/sales/prisma/prisma-timeline-events-repository';
import { UpdateActivityUseCase } from '@/use-cases/sales/activities/update-activity';

export function makeUpdateActivityUseCase() {
  const activitiesRepository = new PrismaActivitiesRepository();
  const timelineEventsRepository = new PrismaTimelineEventsRepository();

  return new UpdateActivityUseCase(
    activitiesRepository,
    timelineEventsRepository,
  );
}

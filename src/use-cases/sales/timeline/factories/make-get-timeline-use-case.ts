import { PrismaActivitiesRepository } from '@/repositories/sales/prisma/prisma-activities-repository';
import { PrismaTimelineEventsRepository } from '@/repositories/sales/prisma/prisma-timeline-events-repository';
import { GetTimelineUseCase } from '@/use-cases/sales/timeline/get-timeline';

export function makeGetTimelineUseCase() {
  const activitiesRepository = new PrismaActivitiesRepository();
  const timelineEventsRepository = new PrismaTimelineEventsRepository();

  return new GetTimelineUseCase(activitiesRepository, timelineEventsRepository);
}

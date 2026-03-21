// TODO: Replace with Prisma repositories when Prisma implementations are created
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { InMemoryTimelineEventsRepository } from '@/repositories/sales/in-memory/in-memory-timeline-events-repository';
import { GetTimelineUseCase } from '@/use-cases/sales/timeline/get-timeline';

export function makeGetTimelineUseCase() {
  const activitiesRepository = new InMemoryActivitiesRepository();
  const timelineEventsRepository = new InMemoryTimelineEventsRepository();

  return new GetTimelineUseCase(activitiesRepository, timelineEventsRepository);
}

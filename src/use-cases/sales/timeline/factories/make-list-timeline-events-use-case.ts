import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { PrismaTimelineEventsRepository } from '@/repositories/sales/prisma/prisma-timeline-events-repository';
import { ListTimelineEventsUseCase } from '@/use-cases/sales/timeline/list-timeline-events';

export function makeListTimelineEventsUseCase() {
  const timelineEventsRepository = new PrismaTimelineEventsRepository();
  const dealsRepository = new PrismaDealsRepository();

  return new ListTimelineEventsUseCase(timelineEventsRepository, dealsRepository);
}

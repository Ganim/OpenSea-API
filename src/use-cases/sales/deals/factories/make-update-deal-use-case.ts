import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { PrismaTimelineEventsRepository } from '@/repositories/sales/prisma/prisma-timeline-events-repository';
import { UpdateDealUseCase } from '@/use-cases/sales/deals/update-deal';

export function makeUpdateDealUseCase() {
  const dealsRepository = new PrismaDealsRepository();
  const timelineEventsRepository = new PrismaTimelineEventsRepository();

  return new UpdateDealUseCase(dealsRepository, timelineEventsRepository);
}

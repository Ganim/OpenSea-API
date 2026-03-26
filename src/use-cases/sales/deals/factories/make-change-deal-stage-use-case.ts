import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { PrismaTimelineEventsRepository } from '@/repositories/sales/prisma/prisma-timeline-events-repository';
import { ChangeDealStageUseCase } from '@/use-cases/sales/deals/change-deal-stage';

export function makeChangeDealStageUseCase() {
  const dealsRepository = new PrismaDealsRepository();
  const pipelineStagesRepository = new PrismaPipelineStagesRepository();
  const timelineEventsRepository = new PrismaTimelineEventsRepository();

  return new ChangeDealStageUseCase(
    dealsRepository,
    pipelineStagesRepository,
    timelineEventsRepository,
  );
}

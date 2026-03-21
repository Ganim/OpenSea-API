// TODO: Replace with Prisma repositories when PrismaDealsRepository is created
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryTimelineEventsRepository } from '@/repositories/sales/in-memory/in-memory-timeline-events-repository';
import { ChangeDealStageUseCase } from '@/use-cases/sales/deals/change-deal-stage';

export function makeChangeDealStageUseCase() {
  const dealsRepository = new InMemoryDealsRepository();
  const pipelineStagesRepository = new InMemoryPipelineStagesRepository();
  const timelineEventsRepository = new InMemoryTimelineEventsRepository();

  return new ChangeDealStageUseCase(
    dealsRepository,
    pipelineStagesRepository,
    timelineEventsRepository,
  );
}

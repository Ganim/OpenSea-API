import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { PrismaTimelineEventsRepository } from '@/repositories/sales/prisma/prisma-timeline-events-repository';
import { CreateDealUseCase } from '@/use-cases/sales/deals/create-deal';

export function makeCreateDealUseCase() {
  const dealsRepository = new PrismaDealsRepository();
  const customersRepository = new PrismaCustomersRepository();
  const pipelinesRepository = new PrismaPipelinesRepository();
  const pipelineStagesRepository = new PrismaPipelineStagesRepository();
  const timelineEventsRepository = new PrismaTimelineEventsRepository();

  return new CreateDealUseCase(
    dealsRepository,
    customersRepository,
    pipelinesRepository,
    pipelineStagesRepository,
    timelineEventsRepository,
  );
}

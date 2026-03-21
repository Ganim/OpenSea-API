// TODO: Replace with Prisma repositories when PrismaDealsRepository is created
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { CreateDealUseCase } from '@/use-cases/sales/deals/create-deal';

export function makeCreateDealUseCase() {
  const dealsRepository = new InMemoryDealsRepository();
  const pipelinesRepository = new InMemoryPipelinesRepository();
  const pipelineStagesRepository = new InMemoryPipelineStagesRepository();

  return new CreateDealUseCase(
    dealsRepository,
    pipelinesRepository,
    pipelineStagesRepository,
  );
}

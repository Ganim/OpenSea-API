import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { PrismaProcessBlueprintsRepository } from '@/repositories/sales/prisma/prisma-process-blueprints-repository';
import { CreateBlueprintUseCase } from '../create-blueprint';

export function makeCreateBlueprintUseCase() {
  const blueprintsRepository = new PrismaProcessBlueprintsRepository();
  const pipelinesRepository = new PrismaPipelinesRepository();
  return new CreateBlueprintUseCase(blueprintsRepository, pipelinesRepository);
}

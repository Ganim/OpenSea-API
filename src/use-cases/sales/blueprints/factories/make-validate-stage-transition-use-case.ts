import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { PrismaProcessBlueprintsRepository } from '@/repositories/sales/prisma/prisma-process-blueprints-repository';
import { ValidateStageTransitionUseCase } from '../validate-stage-transition';

export function makeValidateStageTransitionUseCase() {
  const blueprintsRepository = new PrismaProcessBlueprintsRepository();
  const dealsRepository = new PrismaDealsRepository();
  return new ValidateStageTransitionUseCase(
    blueprintsRepository,
    dealsRepository,
  );
}

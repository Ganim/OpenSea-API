import { PrismaProcessBlueprintsRepository } from '@/repositories/sales/prisma/prisma-process-blueprints-repository';
import { GetBlueprintByIdUseCase } from '../get-blueprint-by-id';

export function makeGetBlueprintByIdUseCase() {
  const blueprintsRepository = new PrismaProcessBlueprintsRepository();
  return new GetBlueprintByIdUseCase(blueprintsRepository);
}

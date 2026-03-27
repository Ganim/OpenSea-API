import { PrismaProcessBlueprintsRepository } from '@/repositories/sales/prisma/prisma-process-blueprints-repository';
import { UpdateBlueprintUseCase } from '../update-blueprint';

export function makeUpdateBlueprintUseCase() {
  const blueprintsRepository = new PrismaProcessBlueprintsRepository();
  return new UpdateBlueprintUseCase(blueprintsRepository);
}

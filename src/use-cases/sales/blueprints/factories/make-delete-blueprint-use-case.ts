import { PrismaProcessBlueprintsRepository } from '@/repositories/sales/prisma/prisma-process-blueprints-repository';
import { DeleteBlueprintUseCase } from '../delete-blueprint';

export function makeDeleteBlueprintUseCase() {
  const blueprintsRepository = new PrismaProcessBlueprintsRepository();
  return new DeleteBlueprintUseCase(blueprintsRepository);
}

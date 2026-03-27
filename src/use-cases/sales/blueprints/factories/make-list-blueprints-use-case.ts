import { PrismaProcessBlueprintsRepository } from '@/repositories/sales/prisma/prisma-process-blueprints-repository';
import { ListBlueprintsUseCase } from '../list-blueprints';

export function makeListBlueprintsUseCase() {
  const blueprintsRepository = new PrismaProcessBlueprintsRepository();
  return new ListBlueprintsUseCase(blueprintsRepository);
}

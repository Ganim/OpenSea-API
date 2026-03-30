import { PrismaObjectivesRepository } from '@/repositories/hr/prisma/prisma-objectives-repository';
import { UpdateObjectiveUseCase } from '../update-objective';

export function makeUpdateObjectiveUseCase() {
  const objectivesRepository = new PrismaObjectivesRepository();
  return new UpdateObjectiveUseCase(objectivesRepository);
}

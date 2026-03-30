import { PrismaObjectivesRepository } from '@/repositories/hr/prisma/prisma-objectives-repository';
import { CreateObjectiveUseCase } from '../create-objective';

export function makeCreateObjectiveUseCase() {
  const objectivesRepository = new PrismaObjectivesRepository();
  return new CreateObjectiveUseCase(objectivesRepository);
}

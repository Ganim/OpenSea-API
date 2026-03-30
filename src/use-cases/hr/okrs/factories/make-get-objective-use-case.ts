import { PrismaObjectivesRepository } from '@/repositories/hr/prisma/prisma-objectives-repository';
import { GetObjectiveUseCase } from '../get-objective';

export function makeGetObjectiveUseCase() {
  const objectivesRepository = new PrismaObjectivesRepository();
  return new GetObjectiveUseCase(objectivesRepository);
}

import { PrismaObjectivesRepository } from '@/repositories/hr/prisma/prisma-objectives-repository';
import { DeleteObjectiveUseCase } from '../delete-objective';

export function makeDeleteObjectiveUseCase() {
  const objectivesRepository = new PrismaObjectivesRepository();
  return new DeleteObjectiveUseCase(objectivesRepository);
}

import { PrismaKeyResultsRepository } from '@/repositories/hr/prisma/prisma-key-results-repository';
import { PrismaObjectivesRepository } from '@/repositories/hr/prisma/prisma-objectives-repository';
import { CreateKeyResultUseCase } from '../create-key-result';

export function makeCreateKeyResultUseCase() {
  const objectivesRepository = new PrismaObjectivesRepository();
  const keyResultsRepository = new PrismaKeyResultsRepository();
  return new CreateKeyResultUseCase(objectivesRepository, keyResultsRepository);
}

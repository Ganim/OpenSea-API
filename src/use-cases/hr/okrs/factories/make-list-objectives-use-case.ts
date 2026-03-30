import { PrismaObjectivesRepository } from '@/repositories/hr/prisma/prisma-objectives-repository';
import { ListObjectivesUseCase } from '../list-objectives';

export function makeListObjectivesUseCase() {
  const objectivesRepository = new PrismaObjectivesRepository();
  return new ListObjectivesUseCase(objectivesRepository);
}

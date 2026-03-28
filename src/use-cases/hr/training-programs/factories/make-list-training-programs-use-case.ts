import { PrismaTrainingProgramsRepository } from '@/repositories/hr/prisma/prisma-training-programs-repository';
import { ListTrainingProgramsUseCase } from '../list-training-programs';

export function makeListTrainingProgramsUseCase() {
  const trainingProgramsRepository = new PrismaTrainingProgramsRepository();
  return new ListTrainingProgramsUseCase(trainingProgramsRepository);
}

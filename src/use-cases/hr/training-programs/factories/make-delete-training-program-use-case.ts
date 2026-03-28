import { PrismaTrainingProgramsRepository } from '@/repositories/hr/prisma/prisma-training-programs-repository';
import { DeleteTrainingProgramUseCase } from '../delete-training-program';

export function makeDeleteTrainingProgramUseCase() {
  const trainingProgramsRepository = new PrismaTrainingProgramsRepository();
  return new DeleteTrainingProgramUseCase(trainingProgramsRepository);
}

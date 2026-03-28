import { PrismaTrainingProgramsRepository } from '@/repositories/hr/prisma/prisma-training-programs-repository';
import { UpdateTrainingProgramUseCase } from '../update-training-program';

export function makeUpdateTrainingProgramUseCase() {
  const trainingProgramsRepository = new PrismaTrainingProgramsRepository();
  return new UpdateTrainingProgramUseCase(trainingProgramsRepository);
}

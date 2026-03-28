import { PrismaTrainingProgramsRepository } from '@/repositories/hr/prisma/prisma-training-programs-repository';
import { GetTrainingProgramUseCase } from '../get-training-program';

export function makeGetTrainingProgramUseCase() {
  const trainingProgramsRepository = new PrismaTrainingProgramsRepository();
  return new GetTrainingProgramUseCase(trainingProgramsRepository);
}

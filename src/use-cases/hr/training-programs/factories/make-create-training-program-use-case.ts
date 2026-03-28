import { PrismaTrainingProgramsRepository } from '@/repositories/hr/prisma/prisma-training-programs-repository';
import { CreateTrainingProgramUseCase } from '../create-training-program';

export function makeCreateTrainingProgramUseCase() {
  const trainingProgramsRepository = new PrismaTrainingProgramsRepository();
  return new CreateTrainingProgramUseCase(trainingProgramsRepository);
}

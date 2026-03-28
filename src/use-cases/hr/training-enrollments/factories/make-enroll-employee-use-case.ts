import { PrismaTrainingEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-training-enrollments-repository';
import { PrismaTrainingProgramsRepository } from '@/repositories/hr/prisma/prisma-training-programs-repository';
import { EnrollEmployeeUseCase } from '../enroll-employee';

export function makeEnrollEmployeeUseCase() {
  const trainingEnrollmentsRepository =
    new PrismaTrainingEnrollmentsRepository();
  const trainingProgramsRepository = new PrismaTrainingProgramsRepository();
  return new EnrollEmployeeUseCase(
    trainingEnrollmentsRepository,
    trainingProgramsRepository,
  );
}

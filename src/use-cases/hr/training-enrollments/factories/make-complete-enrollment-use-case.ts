import { PrismaTrainingEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-training-enrollments-repository';
import { CompleteEnrollmentUseCase } from '../complete-enrollment';

export function makeCompleteEnrollmentUseCase() {
  const trainingEnrollmentsRepository =
    new PrismaTrainingEnrollmentsRepository();
  return new CompleteEnrollmentUseCase(trainingEnrollmentsRepository);
}

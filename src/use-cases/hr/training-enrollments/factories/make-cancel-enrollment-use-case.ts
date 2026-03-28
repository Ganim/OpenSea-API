import { PrismaTrainingEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-training-enrollments-repository';
import { CancelEnrollmentUseCase } from '../cancel-enrollment';

export function makeCancelEnrollmentUseCase() {
  const trainingEnrollmentsRepository =
    new PrismaTrainingEnrollmentsRepository();
  return new CancelEnrollmentUseCase(trainingEnrollmentsRepository);
}

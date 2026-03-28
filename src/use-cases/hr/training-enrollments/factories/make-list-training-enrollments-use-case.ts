import { PrismaTrainingEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-training-enrollments-repository';
import { ListTrainingEnrollmentsUseCase } from '../list-training-enrollments';

export function makeListTrainingEnrollmentsUseCase() {
  const trainingEnrollmentsRepository =
    new PrismaTrainingEnrollmentsRepository();
  return new ListTrainingEnrollmentsUseCase(trainingEnrollmentsRepository);
}

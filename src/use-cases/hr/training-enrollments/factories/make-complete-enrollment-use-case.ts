import { PrismaEsocialEventsRepository } from '@/repositories/esocial/prisma/prisma-esocial-events-repository';
import { PrismaTrainingEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-training-enrollments-repository';
import { PrismaTrainingProgramsRepository } from '@/repositories/hr/prisma/prisma-training-programs-repository';
import { CompleteEnrollmentUseCase } from '../complete-enrollment';

export function makeCompleteEnrollmentUseCase() {
  const trainingEnrollmentsRepository =
    new PrismaTrainingEnrollmentsRepository();
  const trainingProgramsRepository = new PrismaTrainingProgramsRepository();
  const esocialEventsRepository = new PrismaEsocialEventsRepository();
  return new CompleteEnrollmentUseCase(
    trainingEnrollmentsRepository,
    trainingProgramsRepository,
    esocialEventsRepository,
  );
}

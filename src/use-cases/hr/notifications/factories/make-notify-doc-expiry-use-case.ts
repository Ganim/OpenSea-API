import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { PrismaTrainingEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-training-enrollments-repository';
import { PrismaTrainingProgramsRepository } from '@/repositories/hr/prisma/prisma-training-programs-repository';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import { NotifyDocExpiryUseCase } from '../notify-doc-expiry';

export function makeNotifyDocExpiryUseCase(): NotifyDocExpiryUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const medicalExamsRepository = new PrismaMedicalExamsRepository();
  const trainingEnrollmentsRepository =
    new PrismaTrainingEnrollmentsRepository();
  const trainingProgramsRepository = new PrismaTrainingProgramsRepository();
  const createNotificationUseCase = makeCreateNotificationUseCase();

  return new NotifyDocExpiryUseCase(
    employeesRepository,
    medicalExamsRepository,
    trainingEnrollmentsRepository,
    trainingProgramsRepository,
    createNotificationUseCase,
  );
}

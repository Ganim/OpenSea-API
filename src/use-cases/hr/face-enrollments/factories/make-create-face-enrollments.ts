import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaFaceEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-face-enrollments-repository';

import { CreateFaceEnrollmentsUseCase } from '../create-face-enrollments';

export function makeCreateFaceEnrollmentsUseCase() {
  return new CreateFaceEnrollmentsUseCase(
    new PrismaFaceEnrollmentsRepository(),
    new PrismaEmployeesRepository(),
  );
}

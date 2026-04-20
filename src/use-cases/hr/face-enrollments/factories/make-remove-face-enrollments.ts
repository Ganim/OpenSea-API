import { PrismaFaceEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-face-enrollments-repository';

import { RemoveFaceEnrollmentsUseCase } from '../remove-face-enrollments';

export function makeRemoveFaceEnrollmentsUseCase() {
  return new RemoveFaceEnrollmentsUseCase(
    new PrismaFaceEnrollmentsRepository(),
  );
}

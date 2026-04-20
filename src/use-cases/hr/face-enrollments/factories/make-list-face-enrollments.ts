import { PrismaFaceEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-face-enrollments-repository';

import { ListFaceEnrollmentsUseCase } from '../list-face-enrollments';

export function makeListFaceEnrollmentsUseCase() {
  return new ListFaceEnrollmentsUseCase(new PrismaFaceEnrollmentsRepository());
}

import { PrismaAdmissionsRepository } from '@/repositories/hr/prisma/prisma-admissions-repository';
import { GetPublicAdmissionUseCase } from '../get-public-admission';

export function makeGetPublicAdmissionUseCase(): GetPublicAdmissionUseCase {
  const admissionsRepository = new PrismaAdmissionsRepository();
  return new GetPublicAdmissionUseCase(admissionsRepository);
}

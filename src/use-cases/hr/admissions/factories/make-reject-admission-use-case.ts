import { PrismaAdmissionsRepository } from '@/repositories/hr/prisma/prisma-admissions-repository';
import { RejectAdmissionUseCase } from '../reject-admission';

export function makeRejectAdmissionUseCase(): RejectAdmissionUseCase {
  const admissionsRepository = new PrismaAdmissionsRepository();
  return new RejectAdmissionUseCase(admissionsRepository);
}

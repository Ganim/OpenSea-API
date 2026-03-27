import { PrismaAdmissionsRepository } from '@/repositories/hr/prisma/prisma-admissions-repository';
import { GetAdmissionInviteUseCase } from '../get-admission-invite';

export function makeGetAdmissionInviteUseCase(): GetAdmissionInviteUseCase {
  const admissionsRepository = new PrismaAdmissionsRepository();
  return new GetAdmissionInviteUseCase(admissionsRepository);
}

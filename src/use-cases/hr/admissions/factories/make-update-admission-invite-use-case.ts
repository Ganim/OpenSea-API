import { PrismaAdmissionsRepository } from '@/repositories/hr/prisma/prisma-admissions-repository';
import { UpdateAdmissionInviteUseCase } from '../update-admission-invite';

export function makeUpdateAdmissionInviteUseCase(): UpdateAdmissionInviteUseCase {
  const admissionsRepository = new PrismaAdmissionsRepository();
  return new UpdateAdmissionInviteUseCase(admissionsRepository);
}

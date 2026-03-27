import { PrismaAdmissionsRepository } from '@/repositories/hr/prisma/prisma-admissions-repository';
import { CancelAdmissionInviteUseCase } from '../cancel-admission-invite';

export function makeCancelAdmissionInviteUseCase(): CancelAdmissionInviteUseCase {
  const admissionsRepository = new PrismaAdmissionsRepository();
  return new CancelAdmissionInviteUseCase(admissionsRepository);
}

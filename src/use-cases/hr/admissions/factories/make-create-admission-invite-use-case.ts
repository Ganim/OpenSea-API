import { PrismaAdmissionsRepository } from '@/repositories/hr/prisma/prisma-admissions-repository';
import { CreateAdmissionInviteUseCase } from '../create-admission-invite';

export function makeCreateAdmissionInviteUseCase(): CreateAdmissionInviteUseCase {
  const admissionsRepository = new PrismaAdmissionsRepository();
  return new CreateAdmissionInviteUseCase(admissionsRepository);
}

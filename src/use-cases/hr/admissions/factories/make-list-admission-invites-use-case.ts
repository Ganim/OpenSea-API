import { PrismaAdmissionsRepository } from '@/repositories/hr/prisma/prisma-admissions-repository';
import { ListAdmissionInvitesUseCase } from '../list-admission-invites';

export function makeListAdmissionInvitesUseCase(): ListAdmissionInvitesUseCase {
  const admissionsRepository = new PrismaAdmissionsRepository();
  return new ListAdmissionInvitesUseCase(admissionsRepository);
}

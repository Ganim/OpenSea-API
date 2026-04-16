import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { ResolveAudienceUseCase } from '../resolve-audience';

export function makeResolveAudienceUseCase(): ResolveAudienceUseCase {
  return new ResolveAudienceUseCase(
    new PrismaEmployeesRepository(),
    new PrismaTeamMembersRepository(),
  );
}

import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamEmailAccountsRepository } from '@/repositories/core/prisma/prisma-team-email-accounts-repository';
import { ListTeamEmailsUseCase } from '../list-team-emails';

export function makeListTeamEmailsUseCase() {
  return new ListTeamEmailsUseCase(
    new PrismaTeamsRepository(),
    new PrismaTeamMembersRepository(),
    new PrismaTeamEmailAccountsRepository(),
  );
}

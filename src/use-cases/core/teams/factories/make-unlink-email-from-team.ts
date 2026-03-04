import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamEmailAccountsRepository } from '@/repositories/core/prisma/prisma-team-email-accounts-repository';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { UnlinkEmailFromTeamUseCase } from '../unlink-email-from-team';

export function makeUnlinkEmailFromTeamUseCase() {
  return new UnlinkEmailFromTeamUseCase(
    new PrismaTeamsRepository(),
    new PrismaTeamMembersRepository(),
    new PrismaTeamEmailAccountsRepository(),
    new PrismaEmailAccountsRepository(),
  );
}

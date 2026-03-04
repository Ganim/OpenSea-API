import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { PrismaTeamEmailAccountsRepository } from '@/repositories/core/prisma/prisma-team-email-accounts-repository';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { BulkAddTeamMembersUseCase } from '../bulk-add-team-members';

export function makeBulkAddTeamMembersUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();
  const teamEmailAccountsRepository = new PrismaTeamEmailAccountsRepository();
  const emailAccountsRepository = new PrismaEmailAccountsRepository();

  return new BulkAddTeamMembersUseCase(
    teamsRepository,
    teamMembersRepository,
    teamEmailAccountsRepository,
    emailAccountsRepository,
  );
}

import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { PrismaTeamEmailAccountsRepository } from '@/repositories/core/prisma/prisma-team-email-accounts-repository';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { ChangeTeamMemberRoleUseCase } from '../change-team-member-role';

export function makeChangeTeamMemberRoleUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();
  const teamEmailAccountsRepository = new PrismaTeamEmailAccountsRepository();
  const emailAccountsRepository = new PrismaEmailAccountsRepository();

  return new ChangeTeamMemberRoleUseCase(
    teamsRepository,
    teamMembersRepository,
    teamEmailAccountsRepository,
    emailAccountsRepository,
  );
}

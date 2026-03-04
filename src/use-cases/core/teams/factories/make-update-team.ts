import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { UpdateTeamUseCase } from '../update-team';

export function makeUpdateTeamUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();
  const emailAccountsRepository = new PrismaEmailAccountsRepository();

  return new UpdateTeamUseCase(
    teamsRepository,
    teamMembersRepository,
    emailAccountsRepository,
  );
}

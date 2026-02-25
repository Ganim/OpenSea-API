import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { DeleteTeamUseCase } from '../delete-team';

export function makeDeleteTeamUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new DeleteTeamUseCase(teamsRepository, teamMembersRepository);
}

import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { UpdateTeamUseCase } from '../update-team';

export function makeUpdateTeamUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new UpdateTeamUseCase(teamsRepository, teamMembersRepository);
}

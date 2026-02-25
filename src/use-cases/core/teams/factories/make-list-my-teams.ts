import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { ListMyTeamsUseCase } from '../list-my-teams';

export function makeListMyTeamsUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new ListMyTeamsUseCase(teamsRepository, teamMembersRepository);
}

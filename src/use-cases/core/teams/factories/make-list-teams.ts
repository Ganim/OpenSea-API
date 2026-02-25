import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { ListTeamsUseCase } from '../list-teams';

export function makeListTeamsUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new ListTeamsUseCase(teamsRepository, teamMembersRepository);
}

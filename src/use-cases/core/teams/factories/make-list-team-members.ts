import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { ListTeamMembersUseCase } from '../list-team-members';

export function makeListTeamMembersUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new ListTeamMembersUseCase(teamsRepository, teamMembersRepository);
}

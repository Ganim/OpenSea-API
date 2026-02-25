import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { AddTeamMemberUseCase } from '../add-team-member';

export function makeAddTeamMemberUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new AddTeamMemberUseCase(teamsRepository, teamMembersRepository);
}

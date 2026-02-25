import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { RemoveTeamMemberUseCase } from '../remove-team-member';

export function makeRemoveTeamMemberUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new RemoveTeamMemberUseCase(teamsRepository, teamMembersRepository);
}

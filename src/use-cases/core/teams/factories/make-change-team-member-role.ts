import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { ChangeTeamMemberRoleUseCase } from '../change-team-member-role';

export function makeChangeTeamMemberRoleUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new ChangeTeamMemberRoleUseCase(teamsRepository, teamMembersRepository);
}

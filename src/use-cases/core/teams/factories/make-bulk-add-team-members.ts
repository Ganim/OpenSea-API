import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { BulkAddTeamMembersUseCase } from '../bulk-add-team-members';

export function makeBulkAddTeamMembersUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new BulkAddTeamMembersUseCase(teamsRepository, teamMembersRepository);
}

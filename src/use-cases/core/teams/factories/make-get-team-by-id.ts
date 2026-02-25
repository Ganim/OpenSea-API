import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { GetTeamByIdUseCase } from '../get-team-by-id';

export function makeGetTeamByIdUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new GetTeamByIdUseCase(teamsRepository, teamMembersRepository);
}

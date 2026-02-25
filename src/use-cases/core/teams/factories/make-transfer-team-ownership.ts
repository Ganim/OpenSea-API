import { PrismaTeamMembersRepository } from '@/repositories/core/prisma/prisma-team-members-repository';
import { PrismaTeamsRepository } from '@/repositories/core/prisma/prisma-teams-repository';
import { TransferTeamOwnershipUseCase } from '../transfer-team-ownership';

export function makeTransferTeamOwnershipUseCase() {
  const teamsRepository = new PrismaTeamsRepository();
  const teamMembersRepository = new PrismaTeamMembersRepository();

  return new TransferTeamOwnershipUseCase(teamsRepository, teamMembersRepository);
}

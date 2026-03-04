import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TeamEmailAccountItem,
  TeamEmailAccountsRepository,
} from '@/repositories/core/team-email-accounts-repository';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

interface ListTeamEmailsRequest {
  tenantId: string;
  teamId: string;
  requestingUserId: string;
}

interface ListTeamEmailsResponse {
  emailAccounts: TeamEmailAccountItem[];
}

export class ListTeamEmailsUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
    private teamEmailAccountsRepository: TeamEmailAccountsRepository,
  ) {}

  async execute(
    request: ListTeamEmailsRequest,
  ): Promise<ListTeamEmailsResponse> {
    const { tenantId, teamId, requestingUserId } = request;

    // 1. Verify team exists
    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Time não encontrado');
    }

    // 2. Verify requesting user is a member
    const isMember = await this.teamMembersRepository.isUserMember(
      new UniqueEntityID(teamId),
      new UniqueEntityID(requestingUserId),
    );

    if (!isMember) {
      throw new ForbiddenError(
        'Apenas membros do time podem visualizar os emails vinculados',
      );
    }

    // 3. Fetch linked email accounts
    const emailAccounts =
      await this.teamEmailAccountsRepository.findByTeam(teamId);

    return { emailAccounts };
  }
}

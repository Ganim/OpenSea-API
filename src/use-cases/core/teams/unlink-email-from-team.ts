import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmailAccountsRepository } from '@/repositories/email/email-accounts-repository';
import type { TeamEmailAccountsRepository } from '@/repositories/core/team-email-accounts-repository';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

interface UnlinkEmailFromTeamRequest {
  tenantId: string;
  teamId: string;
  accountId: string;
  requestingUserId: string;
}

export class UnlinkEmailFromTeamUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
    private teamEmailAccountsRepository: TeamEmailAccountsRepository,
    private emailAccountsRepository: EmailAccountsRepository,
  ) {}

  async execute(request: UnlinkEmailFromTeamRequest): Promise<void> {
    const { tenantId, teamId, accountId, requestingUserId } = request;

    // 1. Verify team exists
    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Time não encontrado');
    }

    // 2. Verify requesting user is OWNER or ADMIN
    const requestingMember = await this.teamMembersRepository.findByTeamAndUser(
      new UniqueEntityID(teamId),
      new UniqueEntityID(requestingUserId),
    );

    if (!requestingMember || !requestingMember.isAdminOrOwner) {
      throw new ForbiddenError(
        'Apenas proprietários e administradores podem desvincular emails',
      );
    }

    // 3. Verify the link exists
    const teamEmail =
      await this.teamEmailAccountsRepository.findByTeamAndAccount(
        teamId,
        accountId,
      );

    if (!teamEmail) {
      throw new ResourceNotFoundError(
        'Vínculo entre email e time não encontrado',
      );
    }

    // 4. Remove EmailAccountAccess for all members
    const { members } = await this.teamMembersRepository.findMany({
      teamId: new UniqueEntityID(teamId),
    });

    for (const member of members) {
      await this.emailAccountsRepository.deleteAccess(
        accountId,
        member.userId.toString(),
        tenantId,
      );
    }

    // 5. Delete the link
    await this.teamEmailAccountsRepository.deleteByTeamAndAccount(
      teamId,
      accountId,
    );
  }
}

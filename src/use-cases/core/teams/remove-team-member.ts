import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';
import type { TeamEmailAccountsRepository } from '@/repositories/core/team-email-accounts-repository';
import type { EmailAccountsRepository } from '@/repositories/email/email-accounts-repository';

interface RemoveTeamMemberRequest {
  tenantId: string;
  teamId: string;
  requestingUserId: string;
  memberId: string;
}

export class RemoveTeamMemberUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
    private teamEmailAccountsRepository: TeamEmailAccountsRepository,
    private emailAccountsRepository: EmailAccountsRepository,
  ) {}

  async execute(request: RemoveTeamMemberRequest): Promise<void> {
    const { tenantId, teamId, requestingUserId, memberId } = request;

    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Team not found');
    }

    const memberToRemove = await this.teamMembersRepository.findById(
      new UniqueEntityID(memberId),
    );

    if (
      !memberToRemove ||
      !memberToRemove.teamId.equals(new UniqueEntityID(teamId))
    ) {
      throw new ResourceNotFoundError('Team member not found');
    }

    // Self-leave is allowed for non-owners
    const isSelfLeave = memberToRemove.userId.equals(
      new UniqueEntityID(requestingUserId),
    );

    if (isSelfLeave && memberToRemove.isOwner) {
      throw new BadRequestError(
        'Team owner cannot leave. Transfer ownership first',
      );
    }

    if (!isSelfLeave) {
      // Check if requesting user has permission to remove
      const requestingMember =
        await this.teamMembersRepository.findByTeamAndUser(
          new UniqueEntityID(teamId),
          new UniqueEntityID(requestingUserId),
        );

      if (!requestingMember || !requestingMember.isAdminOrOwner) {
        throw new ForbiddenError(
          'Only team owners and admins can remove members',
        );
      }

      // ADMINs cannot remove OWNERs
      if (requestingMember.isAdmin && memberToRemove.isOwner) {
        throw new ForbiddenError('Admins cannot remove team owners');
      }
    }

    // Remove email access for team email accounts before removing member
    const teamEmailAccounts =
      await this.teamEmailAccountsRepository.findByTeam(teamId);

    for (const tea of teamEmailAccounts) {
      await this.emailAccountsRepository.deleteAccess(
        tea.accountId,
        memberToRemove.userId.toString(),
        tenantId,
      );
    }

    await this.teamMembersRepository.remove(new UniqueEntityID(memberId));
  }
}

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';
import type { TeamEmailAccountsRepository } from '@/repositories/core/team-email-accounts-repository';
import type { EmailAccountsRepository } from '@/repositories/email/email-accounts-repository';

import { getPermissionsForRole } from './helpers/get-permissions-for-role';

interface TransferTeamOwnershipRequest {
  tenantId: string;
  teamId: string;
  requestingUserId: string;
  newOwnerUserId: string;
}

export class TransferTeamOwnershipUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
    private teamEmailAccountsRepository: TeamEmailAccountsRepository,
    private emailAccountsRepository: EmailAccountsRepository,
  ) {}

  async execute(request: TransferTeamOwnershipRequest): Promise<void> {
    const { tenantId, teamId, requestingUserId, newOwnerUserId } = request;

    if (requestingUserId === newOwnerUserId) {
      throw new BadRequestError('Cannot transfer ownership to yourself');
    }

    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Team not found');
    }

    // Only current OWNER can transfer
    const currentOwner = await this.teamMembersRepository.findByTeamAndUser(
      new UniqueEntityID(teamId),
      new UniqueEntityID(requestingUserId),
    );

    if (!currentOwner || !currentOwner.isOwner) {
      throw new ForbiddenError('Only team owners can transfer ownership');
    }

    // New owner must be a current member
    const newOwner = await this.teamMembersRepository.findByTeamAndUser(
      new UniqueEntityID(teamId),
      new UniqueEntityID(newOwnerUserId),
    );

    if (!newOwner) {
      throw new BadRequestError(
        'New owner must be a current member of the team',
      );
    }

    // Demote current owner to ADMIN
    await this.teamMembersRepository.update({
      id: currentOwner.id,
      role: 'ADMIN',
    });

    // Promote new owner to OWNER
    await this.teamMembersRepository.update({
      id: newOwner.id,
      role: 'OWNER',
    });

    // Re-sync email access for both users based on new roles
    const teamEmailAccounts =
      await this.teamEmailAccountsRepository.findByTeam(teamId);

    for (const tea of teamEmailAccounts) {
      // Old owner is now ADMIN
      const oldOwnerPerms = getPermissionsForRole('ADMIN', tea);
      await this.emailAccountsRepository.upsertAccess({
        accountId: tea.accountId,
        tenantId,
        userId: requestingUserId,
        canRead: oldOwnerPerms.canRead,
        canSend: oldOwnerPerms.canSend,
        canManage: oldOwnerPerms.canManage,
      });

      // New owner gets OWNER permissions
      const newOwnerPerms = getPermissionsForRole('OWNER', tea);
      await this.emailAccountsRepository.upsertAccess({
        accountId: tea.accountId,
        tenantId,
        userId: newOwnerUserId,
        canRead: newOwnerPerms.canRead,
        canSend: newOwnerPerms.canSend,
        canManage: newOwnerPerms.canManage,
      });
    }
  }
}

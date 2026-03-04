import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmailAccountsRepository } from '@/repositories/email/email-accounts-repository';
import type {
  TeamEmailAccountItem,
  TeamEmailAccountsRepository,
} from '@/repositories/core/team-email-accounts-repository';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

import { getPermissionsForRole } from './helpers/get-permissions-for-role';

interface UpdateTeamEmailPermissionsRequest {
  tenantId: string;
  teamId: string;
  accountId: string;
  requestingUserId: string;
  ownerCanRead?: boolean;
  ownerCanSend?: boolean;
  ownerCanManage?: boolean;
  adminCanRead?: boolean;
  adminCanSend?: boolean;
  adminCanManage?: boolean;
  memberCanRead?: boolean;
  memberCanSend?: boolean;
  memberCanManage?: boolean;
}

interface UpdateTeamEmailPermissionsResponse {
  teamEmail: TeamEmailAccountItem;
}

export class UpdateTeamEmailPermissionsUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
    private teamEmailAccountsRepository: TeamEmailAccountsRepository,
    private emailAccountsRepository: EmailAccountsRepository,
  ) {}

  async execute(
    request: UpdateTeamEmailPermissionsRequest,
  ): Promise<UpdateTeamEmailPermissionsResponse> {
    const { tenantId, teamId, accountId, requestingUserId, ...permUpdates } =
      request;

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
        'Apenas proprietários e administradores podem gerenciar permissões de email',
      );
    }

    // 3. Find the link
    const existing =
      await this.teamEmailAccountsRepository.findByTeamAndAccount(
        teamId,
        accountId,
      );

    if (!existing) {
      throw new ResourceNotFoundError(
        'Vínculo entre email e time não encontrado',
      );
    }

    // 4. Update permissions
    const teamEmail = await this.teamEmailAccountsRepository.update({
      id: existing.id,
      ...permUpdates,
    });

    // 5. Re-sync EmailAccountAccess for all members
    const { members } = await this.teamMembersRepository.findMany({
      teamId: new UniqueEntityID(teamId),
    });

    for (const member of members) {
      const perms = getPermissionsForRole(member.role, teamEmail);

      await this.emailAccountsRepository.upsertAccess({
        accountId,
        tenantId,
        userId: member.userId.toString(),
        canRead: perms.canRead,
        canSend: perms.canSend,
        canManage: perms.canManage,
      });
    }

    return { teamEmail };
  }
}

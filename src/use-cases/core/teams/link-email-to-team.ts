import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
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

interface LinkEmailToTeamRequest {
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

interface LinkEmailToTeamResponse {
  teamEmail: TeamEmailAccountItem;
}

export class LinkEmailToTeamUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
    private teamEmailAccountsRepository: TeamEmailAccountsRepository,
    private emailAccountsRepository: EmailAccountsRepository,
  ) {}

  async execute(
    request: LinkEmailToTeamRequest,
  ): Promise<LinkEmailToTeamResponse> {
    const { tenantId, teamId, accountId, requestingUserId, ...permConfig } =
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
        'Apenas proprietários e administradores podem vincular emails',
      );
    }

    // 3. Verify email account exists
    const emailAccount = await this.emailAccountsRepository.findById(
      accountId,
      tenantId,
    );

    if (!emailAccount) {
      throw new ResourceNotFoundError('Conta de email não encontrada');
    }

    // 4. Verify not already linked
    const existing =
      await this.teamEmailAccountsRepository.findByTeamAndAccount(
        teamId,
        accountId,
      );

    if (existing) {
      throw new BadRequestError(
        'Esta conta de email já está vinculada ao time',
      );
    }

    // 5. Create the link
    const teamEmail = await this.teamEmailAccountsRepository.create({
      tenantId,
      teamId,
      accountId,
      linkedBy: requestingUserId,
      ...permConfig,
    });

    // 6. Grant EmailAccountAccess for all current members
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

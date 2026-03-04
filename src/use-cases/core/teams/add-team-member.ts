import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TeamMemberRole } from '@/entities/core/team-member';
import {
  type TeamMemberDTO,
  teamMemberToDTO,
} from '@/mappers/core/team/team-member-to-dto';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';
import type { TeamEmailAccountsRepository } from '@/repositories/core/team-email-accounts-repository';
import type { EmailAccountsRepository } from '@/repositories/email/email-accounts-repository';

import { getPermissionsForRole } from './helpers/get-permissions-for-role';

interface AddTeamMemberRequest {
  tenantId: string;
  teamId: string;
  requestingUserId: string;
  userId: string;
  role?: TeamMemberRole;
}

interface AddTeamMemberResponse {
  member: TeamMemberDTO;
}

export class AddTeamMemberUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
    private teamEmailAccountsRepository: TeamEmailAccountsRepository,
    private emailAccountsRepository: EmailAccountsRepository,
  ) {}

  async execute(request: AddTeamMemberRequest): Promise<AddTeamMemberResponse> {
    const { tenantId, teamId, requestingUserId, userId, role } = request;

    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Team not found');
    }

    // Check if requesting user is OWNER or ADMIN
    const requestingMember = await this.teamMembersRepository.findByTeamAndUser(
      new UniqueEntityID(teamId),
      new UniqueEntityID(requestingUserId),
    );

    if (!requestingMember || !requestingMember.isAdminOrOwner) {
      throw new ForbiddenError('Only team owners and admins can add members');
    }

    // Cannot add someone who is already a member
    const existingMember = await this.teamMembersRepository.findByTeamAndUser(
      new UniqueEntityID(teamId),
      new UniqueEntityID(userId),
    );

    if (existingMember) {
      throw new BadRequestError('User is already a member of this team');
    }

    // Cannot assign OWNER role via add (use TransferOwnership instead)
    if (role === 'OWNER') {
      throw new BadRequestError(
        'Cannot assign OWNER role directly. Use transfer ownership instead',
      );
    }

    const member = await this.teamMembersRepository.create({
      tenantId: new UniqueEntityID(tenantId),
      teamId: new UniqueEntityID(teamId),
      userId: new UniqueEntityID(userId),
      role: role ?? 'MEMBER',
    });

    // Sync email access for team email accounts
    const teamEmailAccounts =
      await this.teamEmailAccountsRepository.findByTeam(teamId);

    for (const tea of teamEmailAccounts) {
      const perms = getPermissionsForRole(member.role, tea);

      await this.emailAccountsRepository.upsertAccess({
        accountId: tea.accountId,
        tenantId,
        userId,
        canRead: perms.canRead,
        canSend: perms.canSend,
        canManage: perms.canManage,
      });
    }

    return {
      member: teamMemberToDTO(member),
    };
  }
}

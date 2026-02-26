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

interface ChangeTeamMemberRoleRequest {
  tenantId: string;
  teamId: string;
  requestingUserId: string;
  memberId: string;
  role: TeamMemberRole;
}

interface ChangeTeamMemberRoleResponse {
  member: TeamMemberDTO;
}

export class ChangeTeamMemberRoleUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(
    request: ChangeTeamMemberRoleRequest,
  ): Promise<ChangeTeamMemberRoleResponse> {
    const { tenantId, teamId, requestingUserId, memberId, role } = request;

    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Team not found');
    }

    // Only OWNER or ADMIN can change roles
    const requestingMember = await this.teamMembersRepository.findByTeamAndUser(
      new UniqueEntityID(teamId),
      new UniqueEntityID(requestingUserId),
    );

    if (!requestingMember || !requestingMember.isAdminOrOwner) {
      throw new ForbiddenError('Only team owners and admins can change member roles');
    }

    const memberToUpdate = await this.teamMembersRepository.findById(
      new UniqueEntityID(memberId),
    );

    if (!memberToUpdate || !memberToUpdate.teamId.equals(new UniqueEntityID(teamId))) {
      throw new ResourceNotFoundError('Team member not found');
    }

    // Cannot change own role
    if (memberToUpdate.userId.equals(new UniqueEntityID(requestingUserId))) {
      throw new BadRequestError('Cannot change your own role');
    }

    // Cannot promote to OWNER via this use case
    if (role === 'OWNER') {
      throw new BadRequestError('Cannot assign OWNER role. Use transfer ownership instead');
    }

    // ADMINs can only change MEMBER roles, not other ADMINs or OWNER
    if (requestingMember.isAdmin && memberToUpdate.isAdminOrOwner) {
      throw new ForbiddenError('Admins can only change the role of regular members');
    }

    const updatedMember = await this.teamMembersRepository.update({
      id: new UniqueEntityID(memberId),
      role,
    });

    if (!updatedMember) {
      throw new ResourceNotFoundError('Team member not found');
    }

    return {
      member: teamMemberToDTO(updatedMember),
    };
  }
}

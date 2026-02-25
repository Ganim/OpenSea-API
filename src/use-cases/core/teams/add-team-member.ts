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
      throw new BadRequestError('Cannot assign OWNER role directly. Use transfer ownership instead');
    }

    const member = await this.teamMembersRepository.create({
      tenantId: new UniqueEntityID(tenantId),
      teamId: new UniqueEntityID(teamId),
      userId: new UniqueEntityID(userId),
      role: role ?? 'MEMBER',
    });

    return {
      member: teamMemberToDTO(member),
    };
  }
}

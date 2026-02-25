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

interface BulkMemberInput {
  userId: string;
  role?: TeamMemberRole;
}

interface BulkAddTeamMembersRequest {
  tenantId: string;
  teamId: string;
  requestingUserId: string;
  members: BulkMemberInput[];
}

interface BulkAddTeamMembersResponse {
  added: TeamMemberDTO[];
  skipped: string[]; // userIds that were already members
}

export class BulkAddTeamMembersUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(
    request: BulkAddTeamMembersRequest,
  ): Promise<BulkAddTeamMembersResponse> {
    const { tenantId, teamId, requestingUserId, members } = request;

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

    const added: TeamMemberDTO[] = [];
    const skipped: string[] = [];

    for (const input of members) {
      const existingMember = await this.teamMembersRepository.findByTeamAndUser(
        new UniqueEntityID(teamId),
        new UniqueEntityID(input.userId),
      );

      if (existingMember) {
        skipped.push(input.userId);
        continue;
      }

      // Skip OWNER role assignments
      const role = input.role === 'OWNER' ? 'MEMBER' : (input.role ?? 'MEMBER');

      const member = await this.teamMembersRepository.create({
        tenantId: new UniqueEntityID(tenantId),
        teamId: new UniqueEntityID(teamId),
        userId: new UniqueEntityID(input.userId),
        role,
      });

      added.push(teamMemberToDTO(member));
    }

    return { added, skipped };
  }
}

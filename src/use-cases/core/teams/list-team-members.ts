import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TeamMemberRole } from '@/entities/core/team-member';
import {
  type TeamMemberDTO,
  teamMemberToDTO,
} from '@/mappers/core/team/team-member-to-dto';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

interface ListTeamMembersRequest {
  tenantId: string;
  teamId: string;
  role?: TeamMemberRole;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListTeamMembersResponse {
  members: TeamMemberDTO[];
  total: number;
}

export class ListTeamMembersUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(
    request: ListTeamMembersRequest,
  ): Promise<ListTeamMembersResponse> {
    const { tenantId, teamId, role, search, page, limit } = request;

    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Team not found');
    }

    const result = await this.teamMembersRepository.findMany({
      teamId: new UniqueEntityID(teamId),
      role,
      search,
      page,
      limit,
    });

    return {
      members: result.members.map((m) => teamMemberToDTO(m)),
      total: result.total,
    };
  }
}

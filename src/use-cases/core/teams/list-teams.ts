import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type TeamDTO, teamToDTO } from '@/mappers/core/team/team-to-dto';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

interface ListTeamsRequest {
  tenantId: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface ListTeamsResponse {
  teams: TeamDTO[];
  total: number;
}

export class ListTeamsUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(request: ListTeamsRequest): Promise<ListTeamsResponse> {
    const { tenantId, search, isActive, page, limit } = request;

    const result = await this.teamsRepository.findMany({
      tenantId: new UniqueEntityID(tenantId),
      search,
      isActive,
      page,
      limit,
    });

    const teams = await Promise.all(
      result.teams.map(async (team) => {
        const membersCount = await this.teamMembersRepository.countByTeam(team.id);
        return teamToDTO(team, { membersCount });
      }),
    );

    return {
      teams,
      total: result.total,
    };
  }
}

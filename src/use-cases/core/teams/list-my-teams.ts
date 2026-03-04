import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type TeamDTO, teamToDTO } from '@/mappers/core/team/team-to-dto';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

interface ListMyTeamsRequest {
  tenantId: string;
  userId: string;
  page?: number;
  limit?: number;
}

interface ListMyTeamsResponse {
  teams: TeamDTO[];
  total: number;
}

export class ListMyTeamsUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(request: ListMyTeamsRequest): Promise<ListMyTeamsResponse> {
    const { tenantId, userId, page, limit } = request;

    const result = await this.teamsRepository.findByUserId(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(userId),
      page,
      limit,
    );

    const teams = await Promise.all(
      result.teams.map(async (team) => {
        const membersCount = await this.teamMembersRepository.countByTeam(
          team.id,
        );
        return teamToDTO(team, { membersCount });
      }),
    );

    return {
      teams,
      total: result.total,
    };
  }
}

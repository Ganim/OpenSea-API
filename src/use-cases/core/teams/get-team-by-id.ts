import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type TeamDTO, teamToDTO } from '@/mappers/core/team/team-to-dto';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

interface GetTeamByIdRequest {
  tenantId: string;
  teamId: string;
}

interface GetTeamByIdResponse {
  team: TeamDTO;
}

export class GetTeamByIdUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(request: GetTeamByIdRequest): Promise<GetTeamByIdResponse> {
    const { tenantId, teamId } = request;

    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Team not found');
    }

    const membersCount = await this.teamMembersRepository.countByTeam(team.id);
    const creatorsMap = await this.teamsRepository.resolveCreatorNames([
      team.createdBy.toString(),
    ]);
    const creatorName = creatorsMap.get(team.createdBy.toString()) ?? null;

    return {
      team: teamToDTO(team, { membersCount, creatorName }),
    };
  }
}

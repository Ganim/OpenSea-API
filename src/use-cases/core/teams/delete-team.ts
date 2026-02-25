import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

interface DeleteTeamRequest {
  tenantId: string;
  teamId: string;
  userId: string;
}

export class DeleteTeamUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(request: DeleteTeamRequest): Promise<void> {
    const { tenantId, teamId, userId } = request;

    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Team not found');
    }

    // Only OWNER can delete a team
    const member = await this.teamMembersRepository.findByTeamAndUser(
      new UniqueEntityID(teamId),
      new UniqueEntityID(userId),
    );

    if (!member || !member.isOwner) {
      throw new ForbiddenError('Only team owners can delete the team');
    }

    await this.teamsRepository.softDelete(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );
  }
}

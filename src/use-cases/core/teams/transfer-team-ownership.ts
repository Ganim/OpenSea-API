import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

interface TransferTeamOwnershipRequest {
  tenantId: string;
  teamId: string;
  requestingUserId: string;
  newOwnerUserId: string;
}

export class TransferTeamOwnershipUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(request: TransferTeamOwnershipRequest): Promise<void> {
    const { tenantId, teamId, requestingUserId, newOwnerUserId } = request;

    if (requestingUserId === newOwnerUserId) {
      throw new BadRequestError('Cannot transfer ownership to yourself');
    }

    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Team not found');
    }

    // Only current OWNER can transfer
    const currentOwner = await this.teamMembersRepository.findByTeamAndUser(
      new UniqueEntityID(teamId),
      new UniqueEntityID(requestingUserId),
    );

    if (!currentOwner || !currentOwner.isOwner) {
      throw new ForbiddenError('Only team owners can transfer ownership');
    }

    // New owner must be a current member
    const newOwner = await this.teamMembersRepository.findByTeamAndUser(
      new UniqueEntityID(teamId),
      new UniqueEntityID(newOwnerUserId),
    );

    if (!newOwner) {
      throw new BadRequestError('New owner must be a current member of the team');
    }

    // Demote current owner to ADMIN
    await this.teamMembersRepository.update({
      id: currentOwner.id,
      role: 'ADMIN',
    });

    // Promote new owner to OWNER
    await this.teamMembersRepository.update({
      id: newOwner.id,
      role: 'OWNER',
    });
  }
}

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type TeamDTO, teamToDTO } from '@/mappers/core/team/team-to-dto';
import type { TeamsRepository, UpdateTeamSchema } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

interface UpdateTeamRequest {
  tenantId: string;
  teamId: string;
  userId: string;
  name?: string;
  description?: string;
  color?: string;
  avatarUrl?: string;
}

interface UpdateTeamResponse {
  team: TeamDTO;
}

export class UpdateTeamUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(request: UpdateTeamRequest): Promise<UpdateTeamResponse> {
    const { tenantId, teamId, userId, name, description, color, avatarUrl } = request;

    const team = await this.teamsRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(teamId),
    );

    if (!team) {
      throw new ResourceNotFoundError('Team not found');
    }

    // Check if user is OWNER or ADMIN
    const member = await this.teamMembersRepository.findByTeamAndUser(
      new UniqueEntityID(teamId),
      new UniqueEntityID(userId),
    );

    if (!member || !member.isAdminOrOwner) {
      throw new ForbiddenError('Only team owners and admins can update the team');
    }

    const updateData: UpdateTeamSchema = {
      id: new UniqueEntityID(teamId),
      tenantId: new UniqueEntityID(tenantId),
    };

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new BadRequestError('Team name cannot be empty');
      }
      if (name.length > 128) {
        throw new BadRequestError('Team name must be at most 128 characters');
      }

      const slug = this.generateSlug(name);
      const existingTeam = await this.teamsRepository.findBySlug(
        new UniqueEntityID(tenantId),
        slug,
      );
      if (existingTeam && !existingTeam.id.equals(new UniqueEntityID(teamId))) {
        throw new BadRequestError('A team with this name already exists');
      }

      updateData.name = name.trim();
      updateData.slug = slug;
    }

    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const updatedTeam = await this.teamsRepository.update(updateData);

    if (!updatedTeam) {
      throw new ResourceNotFoundError('Team not found');
    }

    const membersCount = await this.teamMembersRepository.countByTeam(updatedTeam.id);

    return {
      team: teamToDTO(updatedTeam, { membersCount }),
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

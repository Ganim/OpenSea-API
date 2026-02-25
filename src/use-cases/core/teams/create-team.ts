import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type TeamDTO, teamToDTO } from '@/mappers/core/team/team-to-dto';
import type { TeamsRepository } from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';

interface CreateTeamRequest {
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  avatarUrl?: string;
}

interface CreateTeamResponse {
  team: TeamDTO;
}

export class CreateTeamUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(request: CreateTeamRequest): Promise<CreateTeamResponse> {
    const { tenantId, userId, name, description, color, avatarUrl } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Team name is required');
    }

    if (name.length > 128) {
      throw new BadRequestError('Team name must be at most 128 characters');
    }

    const slug = this.generateSlug(name);

    const existingTeam = await this.teamsRepository.findBySlug(
      new UniqueEntityID(tenantId),
      slug,
    );

    if (existingTeam) {
      throw new BadRequestError('A team with this name already exists');
    }

    const team = await this.teamsRepository.create({
      tenantId: new UniqueEntityID(tenantId),
      name: name.trim(),
      slug,
      description,
      color,
      avatarUrl,
      createdBy: new UniqueEntityID(userId),
    });

    // Auto-add creator as OWNER
    await this.teamMembersRepository.create({
      tenantId: new UniqueEntityID(tenantId),
      teamId: team.id,
      userId: new UniqueEntityID(userId),
      role: 'OWNER',
    });

    return {
      team: teamToDTO(team, { membersCount: 1 }),
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

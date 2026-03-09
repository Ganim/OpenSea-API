import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

// Lazy import to avoid @env initialization in unit tests
let _logger: { error: (obj: unknown, msg: string) => void } | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = { error: (obj, msg) => console.error(msg, obj) };
    }
  }
  return _logger!;
}
import { type TeamDTO, teamToDTO } from '@/mappers/core/team/team-to-dto';
import type {
  TeamsRepository,
  UpdateTeamSchema,
} from '@/repositories/core/teams-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';
import type { EmailAccountsRepository } from '@/repositories/email/email-accounts-repository';

interface UpdateTeamRequest {
  tenantId: string;
  teamId: string;
  userId: string;
  name?: string;
  description?: string;
  color?: string;
  avatarUrl?: string;
  emailAccountId?: string | null;
}

interface UpdateTeamResponse {
  team: TeamDTO;
}

export class UpdateTeamUseCase {
  constructor(
    private teamsRepository: TeamsRepository,
    private teamMembersRepository: TeamMembersRepository,
    private emailAccountsRepository?: EmailAccountsRepository,
  ) {}

  async execute(request: UpdateTeamRequest): Promise<UpdateTeamResponse> {
    const {
      tenantId,
      teamId,
      userId,
      name,
      description,
      color,
      avatarUrl,
      emailAccountId,
    } = request;

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
      throw new ForbiddenError(
        'Only team owners and admins can update the team',
      );
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

    // Handle emailAccountId in settings
    if (emailAccountId !== undefined) {
      const currentSettings = { ...team.settings };
      const oldEmailAccountId =
        (currentSettings.emailAccountId as string) ?? null;

      if (emailAccountId === null) {
        delete currentSettings.emailAccountId;
      } else {
        // Validate that the email account exists
        if (this.emailAccountsRepository) {
          const emailAccount = await this.emailAccountsRepository.findById(
            emailAccountId,
            tenantId,
          );
          if (!emailAccount) {
            throw new ResourceNotFoundError('Email account not found');
          }
        }
        currentSettings.emailAccountId = emailAccountId;
      }

      updateData.settings = currentSettings;

      // Sync email access for team members
      if (
        oldEmailAccountId !== emailAccountId &&
        this.emailAccountsRepository
      ) {
        await this.syncEmailAccess(
          teamId,
          tenantId,
          oldEmailAccountId,
          emailAccountId,
        );
      }
    }

    const updatedTeam = await this.teamsRepository.update(updateData);

    if (!updatedTeam) {
      throw new ResourceNotFoundError('Team not found');
    }

    const membersCount = await this.teamMembersRepository.countByTeam(
      updatedTeam.id,
    );

    return {
      team: teamToDTO(updatedTeam, { membersCount }),
    };
  }

  private async syncEmailAccess(
    teamId: string,
    tenantId: string,
    oldAccountId: string | null,
    newAccountId: string | null,
  ): Promise<void> {
    if (!this.emailAccountsRepository) return;

    try {
      // Get all team members
      const { members } = await this.teamMembersRepository.findMany({
        teamId: new UniqueEntityID(teamId),
        limit: 1000,
      });

      // Remove access for old account
      if (oldAccountId) {
        for (const m of members) {
          await this.emailAccountsRepository.deleteAccess(
            oldAccountId,
            m.userId.toString(),
            tenantId,
          );
        }
      }

      // Grant access for new account
      if (newAccountId) {
        for (const m of members) {
          const isAdmin = m.isAdminOrOwner;
          await this.emailAccountsRepository.upsertAccess({
            accountId: newAccountId,
            tenantId,
            userId: m.userId.toString(),
            canRead: true,
            canSend: true,
            canManage: isAdmin,
          });
        }
      }
    } catch (error) {
      getLogger().error(
        { err: error, teamId, tenantId },
        'Failed to sync email access for team members',
      );
    }
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

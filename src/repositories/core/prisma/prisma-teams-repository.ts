import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Team } from '@/entities/core/team';
import { prisma } from '@/lib/prisma';
import { teamPrismaToDomain } from '@/mappers/core/team/team-prisma-to-domain';
import type {
  CreateTeamSchema,
  ListTeamsFilters,
  ListTeamsResult,
  TeamsRepository,
  UpdateTeamSchema,
} from '../teams-repository';

export class PrismaTeamsRepository implements TeamsRepository {
  async create(data: CreateTeamSchema): Promise<Team> {
    const teamData = await prisma.team.create({
      data: {
        tenantId: data.tenantId.toString(),
        name: data.name,
        slug: data.slug,
        description: data.description,
        avatarUrl: data.avatarUrl,
        color: data.color,
        permissionGroupId: data.permissionGroupId?.toString(),
        storageFolderId: data.storageFolderId?.toString(),
        settings: (data.settings ?? {}) as object,
        createdBy: data.createdBy.toString(),
      },
    });

    return teamPrismaToDomain(teamData);
  }

  async findById(
    tenantId: UniqueEntityID,
    id: UniqueEntityID,
  ): Promise<Team | null> {
    const teamData = await prisma.team.findFirst({
      where: {
        id: id.toString(),
        tenantId: tenantId.toString(),
        deletedAt: null,
      },
    });

    if (!teamData) return null;
    return teamPrismaToDomain(teamData);
  }

  async resolveCreatorNames(
    creatorIds: string[],
  ): Promise<Map<string, string>> {
    if (creatorIds.length === 0) return new Map();

    const users = await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: {
        id: true,
        username: true,
        email: true,
        profile: { select: { name: true, surname: true } },
      },
    });

    const map = new Map<string, string>();
    for (const u of users) {
      const fullName = [u.profile?.name, u.profile?.surname]
        .filter(Boolean)
        .join(' ');
      const displayName = fullName || u.username || u.email;
      if (displayName) map.set(u.id, displayName);
    }
    return map;
  }

  async findBySlug(
    tenantId: UniqueEntityID,
    slug: string,
  ): Promise<Team | null> {
    const teamData = await prisma.team.findFirst({
      where: {
        slug,
        tenantId: tenantId.toString(),
        deletedAt: null,
      },
    });

    if (!teamData) return null;
    return teamPrismaToDomain(teamData);
  }

  async findMany(filters: ListTeamsFilters): Promise<ListTeamsResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const whereCondition = {
      tenantId: filters.tenantId.toString(),
      deletedAt: null,
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                name: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.team.count({ where: whereCondition }),
    ]);

    return {
      teams: teams.map(teamPrismaToDomain),
      total,
    };
  }

  async findByUserId(
    tenantId: UniqueEntityID,
    userId: UniqueEntityID,
    page = 1,
    limit = 20,
  ): Promise<ListTeamsResult> {
    const skip = (page - 1) * limit;

    const whereCondition = {
      tenantId: tenantId.toString(),
      deletedAt: null,
      members: {
        some: {
          userId: userId.toString(),
          leftAt: null,
        },
      },
    };

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.team.count({ where: whereCondition }),
    ]);

    return {
      teams: teams.map(teamPrismaToDomain),
      total,
    };
  }

  async update(data: UpdateTeamSchema): Promise<Team | null> {
    const existing = await prisma.team.findFirst({
      where: {
        id: data.id.toString(),
        tenantId: data.tenantId.toString(),
        deletedAt: null,
      },
    });

    if (!existing) return null;

    const teamData = await prisma.team.update({
      where: { id: data.id.toString() },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        avatarUrl: data.avatarUrl,
        color: data.color,
        isActive: data.isActive,
        permissionGroupId: data.permissionGroupId?.toString(),
        storageFolderId: data.storageFolderId?.toString(),
        settings: data.settings as object | undefined,
      },
    });

    return teamPrismaToDomain(teamData);
  }

  async softDelete(
    tenantId: UniqueEntityID,
    id: UniqueEntityID,
  ): Promise<void> {
    const existing = await prisma.team.findFirst({
      where: {
        id: id.toString(),
        tenantId: tenantId.toString(),
        deletedAt: null,
      },
    });

    if (!existing) return;

    await prisma.team.update({
      where: { id: id.toString() },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}

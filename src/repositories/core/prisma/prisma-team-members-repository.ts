import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TeamMember } from '@/entities/core/team-member';
import { prisma } from '@/lib/prisma';
import { teamMemberPrismaToDomain } from '@/mappers/core/team/team-member-prisma-to-domain';
import type {
  CreateTeamMemberSchema,
  ListTeamMembersFilters,
  ListTeamMembersResult,
  TeamMembersRepository,
  UpdateTeamMemberSchema,
} from '../team-members-repository';

export class PrismaTeamMembersRepository implements TeamMembersRepository {
  async create(data: CreateTeamMemberSchema): Promise<TeamMember> {
    const memberData = await prisma.teamMember.create({
      data: {
        tenantId: data.tenantId.toString(),
        teamId: data.teamId.toString(),
        userId: data.userId.toString(),
        role: data.role ?? 'MEMBER',
      },
    });

    return teamMemberPrismaToDomain(memberData);
  }

  async findById(id: UniqueEntityID): Promise<TeamMember | null> {
    const memberData = await prisma.teamMember.findFirst({
      where: {
        id: id.toString(),
        leftAt: null,
      },
    });

    if (!memberData) return null;
    return teamMemberPrismaToDomain(memberData);
  }

  async findByTeamAndUser(
    teamId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<TeamMember | null> {
    const memberData = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId.toString(),
        userId: userId.toString(),
        leftAt: null,
      },
    });

    if (!memberData) return null;
    return teamMemberPrismaToDomain(memberData);
  }

  async findMany(
    filters: ListTeamMembersFilters,
  ): Promise<ListTeamMembersResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const whereCondition = {
      teamId: filters.teamId.toString(),
      leftAt: null,
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.search
        ? {
            user: {
              OR: [
                {
                  email: {
                    contains: filters.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  profile: {
                    OR: [
                      {
                        name: {
                          contains: filters.search,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        surname: {
                          contains: filters.search,
                          mode: 'insensitive' as const,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          }
        : {}),
    };

    const [members, total] = await Promise.all([
      prisma.teamMember.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { joinedAt: 'asc' },
      }),
      prisma.teamMember.count({ where: whereCondition }),
    ]);

    return {
      members: members.map(teamMemberPrismaToDomain),
      total,
    };
  }

  async update(data: UpdateTeamMemberSchema): Promise<TeamMember | null> {
    const existing = await prisma.teamMember.findFirst({
      where: {
        id: data.id.toString(),
        leftAt: null,
      },
    });

    if (!existing) return null;

    const memberData = await prisma.teamMember.update({
      where: { id: data.id.toString() },
      data: {
        role: data.role,
      },
    });

    return teamMemberPrismaToDomain(memberData);
  }

  async remove(id: UniqueEntityID): Promise<void> {
    await prisma.teamMember.update({
      where: { id: id.toString() },
      data: { leftAt: new Date() },
    });
  }

  async countByTeam(teamId: UniqueEntityID): Promise<number> {
    return prisma.teamMember.count({
      where: {
        teamId: teamId.toString(),
        leftAt: null,
      },
    });
  }

  async isUserMember(
    teamId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<boolean> {
    const count = await prisma.teamMember.count({
      where: {
        teamId: teamId.toString(),
        userId: userId.toString(),
        leftAt: null,
      },
    });
    return count > 0;
  }
}

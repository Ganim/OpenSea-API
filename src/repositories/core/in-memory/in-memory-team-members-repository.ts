import { TeamMember } from '@/entities/core/team-member';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreateTeamMemberSchema,
  ListTeamMembersFilters,
  ListTeamMembersResult,
  TeamMembersRepository,
  UpdateTeamMemberSchema,
} from '../team-members-repository';

export class InMemoryTeamMembersRepository implements TeamMembersRepository {
  public items: TeamMember[] = [];

  async create(data: CreateTeamMemberSchema): Promise<TeamMember> {
    const member = TeamMember.create({
      tenantId: data.tenantId,
      teamId: data.teamId,
      userId: data.userId,
      role: data.role ?? 'MEMBER',
    });

    this.items.push(member);
    return member;
  }

  async findById(id: UniqueEntityID): Promise<TeamMember | null> {
    const member = this.items.find(
      (item) => item.id.equals(id) && item.leftAt === undefined,
    );
    return member ?? null;
  }

  async findByTeamAndUser(
    teamId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<TeamMember | null> {
    const member = this.items.find(
      (item) =>
        item.teamId.equals(teamId) &&
        item.userId.equals(userId) &&
        item.leftAt === undefined,
    );
    return member ?? null;
  }

  async findMany(
    filters: ListTeamMembersFilters,
  ): Promise<ListTeamMembersResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    let filtered = this.items.filter(
      (item) => item.teamId.equals(filters.teamId) && item.leftAt === undefined,
    );

    if (filters.role) {
      filtered = filtered.filter((item) => item.role === filters.role);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const members = filtered.slice(start, start + limit);

    return { members, total };
  }

  async update(data: UpdateTeamMemberSchema): Promise<TeamMember | null> {
    const member = this.items.find(
      (item) => item.id.equals(data.id) && item.leftAt === undefined,
    );

    if (!member) return null;

    if (data.role !== undefined) member.role = data.role;

    return member;
  }

  async remove(id: UniqueEntityID): Promise<void> {
    const member = this.items.find(
      (item) => item.id.equals(id) && item.leftAt === undefined,
    );

    if (member) {
      member.leave();
    }
  }

  async countByTeam(teamId: UniqueEntityID): Promise<number> {
    return this.items.filter(
      (item) => item.teamId.equals(teamId) && item.leftAt === undefined,
    ).length;
  }

  async isUserMember(
    teamId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<boolean> {
    return this.items.some(
      (item) =>
        item.teamId.equals(teamId) &&
        item.userId.equals(userId) &&
        item.leftAt === undefined,
    );
  }
}

import { Team } from '@/entities/core/team';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreateTeamSchema,
  ListTeamsFilters,
  ListTeamsResult,
  TeamsRepository,
  UpdateTeamSchema,
} from '../teams-repository';

export class InMemoryTeamsRepository implements TeamsRepository {
  public items: Team[] = [];

  async create(data: CreateTeamSchema): Promise<Team> {
    const team = Team.create({
      tenantId: data.tenantId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      avatarUrl: data.avatarUrl,
      color: data.color,
      permissionGroupId: data.permissionGroupId,
      storageFolderId: data.storageFolderId,
      settings: data.settings ?? {},
      createdBy: data.createdBy,
    });

    this.items.push(team);
    return team;
  }

  async findById(
    tenantId: UniqueEntityID,
    id: UniqueEntityID,
  ): Promise<Team | null> {
    const team = this.items.find(
      (item) =>
        item.id.equals(id) &&
        item.tenantId.equals(tenantId) &&
        item.deletedAt === undefined,
    );
    return team ?? null;
  }

  async findBySlug(
    tenantId: UniqueEntityID,
    slug: string,
  ): Promise<Team | null> {
    const team = this.items.find(
      (item) =>
        item.slug === slug &&
        item.tenantId.equals(tenantId) &&
        item.deletedAt === undefined,
    );
    return team ?? null;
  }

  async findMany(filters: ListTeamsFilters): Promise<ListTeamsResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    let filtered = this.items.filter(
      (item) =>
        item.tenantId.equals(filters.tenantId) && item.deletedAt === undefined,
    );

    if (filters.isActive !== undefined) {
      filtered = filtered.filter((item) => item.isActive === filters.isActive);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          (item.description?.toLowerCase().includes(search) ?? false),
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const teams = filtered.slice(start, start + limit);

    return { teams, total };
  }

  async findByUserId(
    tenantId: UniqueEntityID,
    userId: UniqueEntityID,
    page = 1,
    limit = 20,
  ): Promise<ListTeamsResult> {
    // This method needs teamMembers data. In tests, we'll use a separate members repo.
    // For in-memory, we just return all teams (tests will set up proper data).
    const filtered = this.items.filter(
      (item) => item.tenantId.equals(tenantId) && item.deletedAt === undefined,
    );

    const total = filtered.length;
    const start = (page - 1) * limit;
    const teams = filtered.slice(start, start + limit);

    return { teams, total };
  }

  async update(data: UpdateTeamSchema): Promise<Team | null> {
    const team = this.items.find(
      (item) =>
        item.id.equals(data.id) &&
        item.tenantId.equals(data.tenantId) &&
        item.deletedAt === undefined,
    );

    if (!team) return null;

    if (data.name !== undefined) team.name = data.name;
    if (data.slug !== undefined) team.slug = data.slug;
    if (data.description !== undefined) team.description = data.description;
    if (data.avatarUrl !== undefined) team.avatarUrl = data.avatarUrl;
    if (data.color !== undefined) team.color = data.color;
    if (data.isActive !== undefined) team.isActive = data.isActive;
    if (data.permissionGroupId !== undefined)
      team.permissionGroupId = data.permissionGroupId;
    if (data.storageFolderId !== undefined)
      team.storageFolderId = data.storageFolderId;
    if (data.settings !== undefined) team.settings = data.settings;

    return team;
  }

  async softDelete(
    tenantId: UniqueEntityID,
    id: UniqueEntityID,
  ): Promise<void> {
    const team = this.items.find(
      (item) =>
        item.id.equals(id) &&
        item.tenantId.equals(tenantId) &&
        item.deletedAt === undefined,
    );

    if (team) {
      team.delete();
    }
  }

  async resolveCreatorNames(
    _creatorIds: string[],
  ): Promise<Map<string, string>> {
    return new Map();
  }
}

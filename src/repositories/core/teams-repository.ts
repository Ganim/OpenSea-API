import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Team } from '@/entities/core/team';

export interface CreateTeamSchema {
  tenantId: UniqueEntityID;
  name: string;
  slug: string;
  description?: string;
  avatarUrl?: string;
  color?: string;
  permissionGroupId?: UniqueEntityID;
  storageFolderId?: UniqueEntityID;
  settings?: Record<string, unknown>;
  createdBy: UniqueEntityID;
}

export interface UpdateTeamSchema {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name?: string;
  slug?: string;
  description?: string;
  avatarUrl?: string;
  color?: string;
  isActive?: boolean;
  permissionGroupId?: UniqueEntityID;
  storageFolderId?: UniqueEntityID;
  settings?: Record<string, unknown>;
}

export interface ListTeamsFilters {
  tenantId: UniqueEntityID;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ListTeamsResult {
  teams: Team[];
  total: number;
  creatorsMap?: Map<string, string>;
}

export interface TeamsRepository {
  create(data: CreateTeamSchema): Promise<Team>;
  findById(tenantId: UniqueEntityID, id: UniqueEntityID): Promise<Team | null>;
  findBySlug(tenantId: UniqueEntityID, slug: string): Promise<Team | null>;
  findMany(filters: ListTeamsFilters): Promise<ListTeamsResult>;
  findByUserId(
    tenantId: UniqueEntityID,
    userId: UniqueEntityID,
    page?: number,
    limit?: number,
  ): Promise<ListTeamsResult>;
  update(data: UpdateTeamSchema): Promise<Team | null>;
  softDelete(tenantId: UniqueEntityID, id: UniqueEntityID): Promise<void>;
  resolveCreatorNames(creatorIds: string[]): Promise<Map<string, string>>;
}

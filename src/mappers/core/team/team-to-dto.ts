import type { Team } from '@/entities/core/team';

export interface TeamDTO {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  color: string | null;
  isActive: boolean;
  permissionGroupId: string | null;
  storageFolderId: string | null;
  settings: Record<string, unknown>;
  membersCount: number;
  createdBy: string;
  creatorName: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function teamToDTO(
  team: Team,
  extra?: { membersCount?: number; creatorName?: string | null },
): TeamDTO {
  return {
    id: team.id.toString(),
    tenantId: team.tenantId.toString(),
    name: team.name,
    slug: team.slug,
    description: team.description ?? null,
    avatarUrl: team.avatarUrl ?? null,
    color: team.color ?? null,
    isActive: team.isActive,
    permissionGroupId: team.permissionGroupId?.toString() ?? null,
    storageFolderId: team.storageFolderId?.toString() ?? null,
    settings: team.settings,
    membersCount: extra?.membersCount ?? 0,
    createdBy: team.createdBy.toString(),
    creatorName: extra?.creatorName ?? null,
    deletedAt: team.deletedAt ?? null,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt ?? null,
  };
}

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Team } from '@/entities/core/team';
import type { Team as PrismaTeam } from '@prisma/generated/client.js';

export function mapTeamPrismaToDomain(teamDb: PrismaTeam) {
  return {
    id: new UniqueEntityID(teamDb.id),
    tenantId: new UniqueEntityID(teamDb.tenantId),
    name: teamDb.name,
    slug: teamDb.slug,
    description: teamDb.description ?? undefined,
    avatarUrl: teamDb.avatarUrl ?? undefined,
    color: teamDb.color ?? undefined,
    isActive: teamDb.isActive,
    permissionGroupId: teamDb.permissionGroupId
      ? new UniqueEntityID(teamDb.permissionGroupId)
      : undefined,
    storageFolderId: teamDb.storageFolderId
      ? new UniqueEntityID(teamDb.storageFolderId)
      : undefined,
    settings: (teamDb.settings as Record<string, unknown>) ?? {},
    createdBy: new UniqueEntityID(teamDb.createdBy),
    deletedAt: teamDb.deletedAt ?? undefined,
    createdAt: teamDb.createdAt,
    updatedAt: teamDb.updatedAt,
  };
}

export function teamPrismaToDomain(teamDb: PrismaTeam): Team {
  return Team.create(mapTeamPrismaToDomain(teamDb), new UniqueEntityID(teamDb.id));
}

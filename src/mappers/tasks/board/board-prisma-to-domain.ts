import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Board } from '@/entities/tasks/board';
import type {
  Board as PrismaBoard,
  BoardColumn,
  BoardLabel,
  BoardMember,
} from '@prisma/generated/client.js';

export type BoardUserWithProfile = {
  id: string;
  email: string;
  username: string | null;
  profile?: { name: string; surname: string; avatarUrl?: string | null } | null;
};

export type BoardWithRelations = PrismaBoard & {
  owner?: BoardUserWithProfile | null;
  columns?: BoardColumn[];
  labels?: BoardLabel[];
  members?: (BoardMember & {
    user?: BoardUserWithProfile | null;
  })[];
};

export function boardPrismaToDomain(raw: PrismaBoard): Board {
  return Board.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      title: raw.title,
      description: raw.description ?? null,
      type: raw.type,
      teamId: raw.teamId ? new UniqueEntityID(raw.teamId) : null,
      ownerId: new UniqueEntityID(raw.ownerId),
      storageFolderId: raw.storageFolderId ?? null,
      gradientId: raw.gradientId ?? null,
      visibility: raw.visibility,
      defaultView: raw.defaultView,
      settings: (raw.settings as Record<string, unknown>) ?? null,
      metadata: (raw.metadata as Record<string, unknown>) ?? null,
      position: raw.position,
      archivedAt: raw.archivedAt ?? null,
      deletedAt: raw.deletedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? null,
    },
    new UniqueEntityID(raw.id),
  );
}

function resolveUserName(
  user: BoardUserWithProfile | null | undefined,
): string | null {
  if (!user) return null;

  if (user.profile) {
    const fullName =
      `${user.profile.name ?? ''} ${user.profile.surname ?? ''}`.trim();
    return fullName || user.username || null;
  }

  return user.username || null;
}

export function extractBoardRelationsFromPrisma(raw: BoardWithRelations) {
  const columns = (raw.columns ?? []).map((column) => ({
    id: column.id,
    boardId: column.boardId,
    title: column.title,
    color: column.color,
    position: column.position,
    isDefault: column.isDefault,
    isDone: column.isDone,
    wipLimit: column.wipLimit,
    archivedAt: column.archivedAt,
    createdAt: column.createdAt,
  }));

  const labels = (raw.labels ?? []).map((label) => ({
    id: label.id,
    boardId: label.boardId,
    name: label.name,
    color: label.color,
    position: label.position,
  }));

  const members = (raw.members ?? []).map((member) => ({
    id: member.id,
    boardId: member.boardId,
    userId: member.userId,
    role: member.role,
    userName: resolveUserName(member.user),
    userEmail: member.user?.email ?? null,
    userAvatarUrl: member.user?.profile?.avatarUrl ?? null,
    createdAt: member.createdAt,
  }));

  return { columns, labels, members };
}

import { prisma } from '@/lib/prisma';
import type { BoardMemberRole } from '@prisma/generated/client.js';
import type {
  BoardMemberRecord,
  BoardMembersRepository,
  CreateBoardMemberSchema,
  UpdateBoardMemberSchema,
} from '../board-members-repository';

const userInclude = {
  user: {
    select: {
      id: true,
      email: true,
      username: true,
      profile: { select: { name: true, surname: true } },
    },
  },
} as const;

function resolveUserName(
  user: {
    username: string | null;
    profile?: { name: string; surname: string } | null;
  } | null,
): string | null {
  if (!user) return null;

  if (user.profile) {
    const fullName =
      `${user.profile.name ?? ''} ${user.profile.surname ?? ''}`.trim();
    return fullName || user.username || null;
  }

  return user.username || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): BoardMemberRecord {
  return {
    id: raw.id,
    boardId: raw.boardId,
    userId: raw.userId,
    role: raw.role,
    createdAt: raw.createdAt,
    userName: resolveUserName(raw.user ?? null),
    userEmail: raw.user?.email ?? null,
  };
}

export class PrismaBoardMembersRepository implements BoardMembersRepository {
  async create(data: CreateBoardMemberSchema): Promise<BoardMemberRecord> {
    const raw = await prisma.boardMember.create({
      data: {
        boardId: data.boardId,
        userId: data.userId,
        role: (data.role as BoardMemberRole) ?? 'VIEWER',
      },
      include: userInclude,
    });

    return toRecord(raw);
  }

  async findByBoardId(boardId: string): Promise<BoardMemberRecord[]> {
    const rows = await prisma.boardMember.findMany({
      where: { boardId },
      include: userInclude,
    });

    return rows.map(toRecord);
  }

  async findByBoardAndUser(
    boardId: string,
    userId: string,
  ): Promise<BoardMemberRecord | null> {
    const raw = await prisma.boardMember.findFirst({
      where: { boardId, userId },
      include: userInclude,
    });

    return raw ? toRecord(raw) : null;
  }

  async update(
    data: UpdateBoardMemberSchema,
  ): Promise<BoardMemberRecord | null> {
    const raw = await prisma.boardMember.update({
      where: { id: data.id },
      data: { role: data.role as BoardMemberRole },
      include: userInclude,
    });

    return toRecord(raw);
  }

  async delete(id: string, _boardId: string): Promise<void> {
    await prisma.boardMember.delete({
      where: { id },
    });
  }
}

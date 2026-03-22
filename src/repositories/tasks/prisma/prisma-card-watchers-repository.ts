import { prisma } from '@/lib/prisma';
import type {
  AddMemberSchema,
  CardMemberRecord,
  CardWatcherRecord,
  CardWatchersRepository,
  CreateCardWatcherSchema,
} from '../card-watchers-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): CardWatcherRecord {
  return {
    id: raw.id,
    cardId: raw.cardId,
    userId: raw.userId,
    boardId: raw.boardId,
    role: raw.role,
    createdAt: raw.createdAt,
  };
}

export class PrismaCardWatchersRepository implements CardWatchersRepository {
  async create(data: CreateCardWatcherSchema): Promise<CardWatcherRecord> {
    const raw = await prisma.cardWatcher.create({
      data: {
        cardId: data.cardId,
        userId: data.userId,
        boardId: data.boardId,
      },
    });

    return toRecord(raw);
  }

  async findByCardId(cardId: string): Promise<CardWatcherRecord[]> {
    const rows = await prisma.cardWatcher.findMany({
      where: { cardId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toRecord);
  }

  async findByCardAndUser(
    cardId: string,
    userId: string,
  ): Promise<CardWatcherRecord | null> {
    const raw = await prisma.cardWatcher.findUnique({
      where: {
        cardId_userId: { cardId, userId },
      },
    });

    return raw ? toRecord(raw) : null;
  }

  async delete(cardId: string, userId: string): Promise<void> {
    await prisma.cardWatcher.delete({
      where: {
        cardId_userId: { cardId, userId },
      },
    });
  }

  async findMembersByCardId(cardId: string): Promise<CardMemberRecord[]> {
    const rows = await prisma.cardWatcher.findMany({
      where: { cardId, role: 'MEMBER' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { username: true, email: true },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      cardId: row.cardId,
      userId: row.userId,
      userName:
        (row as unknown as { user?: { username?: string | null } }).user
          ?.username ?? null,
      userEmail:
        (row as unknown as { user?: { email?: string | null } }).user?.email ??
        null,
      addedAt: row.createdAt,
    }));
  }

  async addMember(data: AddMemberSchema): Promise<CardWatcherRecord> {
    const card = await prisma.card.findUniqueOrThrow({
      where: { id: data.cardId },
      select: { boardId: true },
    });

    const raw = await prisma.cardWatcher.upsert({
      where: {
        cardId_userId: { cardId: data.cardId, userId: data.userId },
      },
      update: {
        role: 'MEMBER',
      },
      create: {
        cardId: data.cardId,
        userId: data.userId,
        boardId: card.boardId,
        role: 'MEMBER',
      },
    });

    return toRecord(raw);
  }

  async removeMember(cardId: string, userId: string): Promise<void> {
    await prisma.cardWatcher.delete({
      where: {
        cardId_userId: { cardId, userId },
      },
    });
  }
}

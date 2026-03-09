import { prisma } from '@/lib/prisma';
import type {
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
}

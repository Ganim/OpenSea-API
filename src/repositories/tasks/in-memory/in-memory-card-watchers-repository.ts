import { randomUUID } from 'node:crypto';
import type {
  CardWatcherRecord,
  CardWatchersRepository,
  CreateCardWatcherSchema,
} from '../card-watchers-repository';

export class InMemoryCardWatchersRepository implements CardWatchersRepository {
  public items: CardWatcherRecord[] = [];

  async create(data: CreateCardWatcherSchema): Promise<CardWatcherRecord> {
    const watcher: CardWatcherRecord = {
      id: randomUUID(),
      cardId: data.cardId,
      userId: data.userId,
      boardId: data.boardId,
      createdAt: new Date(),
    };

    this.items.push(watcher);
    return watcher;
  }

  async findByCardId(cardId: string): Promise<CardWatcherRecord[]> {
    return this.items
      .filter((w) => w.cardId === cardId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findByCardAndUser(
    cardId: string,
    userId: string,
  ): Promise<CardWatcherRecord | null> {
    return (
      this.items.find((w) => w.cardId === cardId && w.userId === userId) ?? null
    );
  }

  async delete(cardId: string, userId: string): Promise<void> {
    this.items = this.items.filter(
      (w) => !(w.cardId === cardId && w.userId === userId),
    );
  }
}

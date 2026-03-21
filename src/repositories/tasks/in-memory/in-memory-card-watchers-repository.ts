import { randomUUID } from 'node:crypto';
import type {
  AddMemberSchema,
  CardMemberRecord,
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
      role: 'WATCHER',
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

  async findMembersByCardId(cardId: string): Promise<CardMemberRecord[]> {
    return this.items
      .filter((w) => w.cardId === cardId && w.role === 'MEMBER')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(w => ({
        id: w.id,
        cardId: w.cardId,
        userId: w.userId,
        userName: null,
        userEmail: null,
        addedAt: w.createdAt,
      }));
  }

  async addMember(data: AddMemberSchema): Promise<CardWatcherRecord> {
    const existing = this.items.find(
      (w) => w.cardId === data.cardId && w.userId === data.userId,
    );

    if (existing) {
      existing.role = 'MEMBER';
      return existing;
    }

    const watcher: CardWatcherRecord = {
      id: randomUUID(),
      cardId: data.cardId,
      userId: data.userId,
      boardId: 'board-id',
      role: 'MEMBER',
      createdAt: new Date(),
    };

    this.items.push(watcher);
    return watcher;
  }

  async removeMember(cardId: string, userId: string): Promise<void> {
    this.items = this.items.filter(
      (w) => !(w.cardId === cardId && w.userId === userId),
    );
  }
}

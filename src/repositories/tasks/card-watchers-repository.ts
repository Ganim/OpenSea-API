export interface CardWatcherRecord {
  id: string;
  cardId: string;
  userId: string;
  boardId: string;
  createdAt: Date;
}

export interface CreateCardWatcherSchema {
  cardId: string;
  userId: string;
  boardId: string;
}

export interface CardWatchersRepository {
  create(data: CreateCardWatcherSchema): Promise<CardWatcherRecord>;
  findByCardId(cardId: string): Promise<CardWatcherRecord[]>;
  findByCardAndUser(
    cardId: string,
    userId: string,
  ): Promise<CardWatcherRecord | null>;
  delete(cardId: string, userId: string): Promise<void>;
}

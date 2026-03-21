export interface CardWatcherRecord {
  id: string;
  cardId: string;
  userId: string;
  boardId: string;
  role: string;
  createdAt: Date;
}

export interface CreateCardWatcherSchema {
  cardId: string;
  userId: string;
  boardId: string;
}

export interface AddMemberSchema {
  cardId: string;
  userId: string;
  addedBy: string;
}

export interface CardMemberRecord {
  id: string;
  cardId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  addedAt: Date;
}

export interface CardWatchersRepository {
  create(data: CreateCardWatcherSchema): Promise<CardWatcherRecord>;
  findByCardId(cardId: string): Promise<CardWatcherRecord[]>;
  findByCardAndUser(
    cardId: string,
    userId: string,
  ): Promise<CardWatcherRecord | null>;
  delete(cardId: string, userId: string): Promise<void>;
  findMembersByCardId(cardId: string): Promise<CardMemberRecord[]>;
  addMember(data: AddMemberSchema): Promise<CardWatcherRecord>;
  removeMember(cardId: string, userId: string): Promise<void>;
}

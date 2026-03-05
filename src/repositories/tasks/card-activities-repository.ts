export interface CardActivityRecord {
  id: string;
  cardId: string;
  boardId: string;
  userId: string;
  type: string;
  description: string;
  field: string | null;
  oldValue: unknown;
  newValue: unknown;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  userName?: string | null;
}

export interface CreateCardActivitySchema {
  cardId: string;
  boardId: string;
  userId: string;
  type: string;
  description: string;
  field?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown> | null;
}

export interface FindManyCardActivitiesOptions {
  cardId: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface FindManyCardActivitiesResult {
  activities: CardActivityRecord[];
  total: number;
}

export interface FindManyBoardActivitiesOptions {
  boardId: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface FindManyBoardActivitiesResult {
  activities: CardActivityRecord[];
  total: number;
}

export interface CardActivitiesRepository {
  create(data: CreateCardActivitySchema): Promise<CardActivityRecord>;
  findByCardId(
    options: FindManyCardActivitiesOptions,
  ): Promise<FindManyCardActivitiesResult>;
  findByBoardId(
    options: FindManyBoardActivitiesOptions,
  ): Promise<FindManyBoardActivitiesResult>;
}

import type { Card } from '@/entities/tasks/card';

export interface CreateCardSchema {
  boardId: string;
  columnId: string;
  parentCardId?: string | null;
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  position?: number;
  assigneeId?: string | null;
  reporterId: string;
  startDate?: Date | null;
  dueDate?: Date | null;
  estimatedMinutes?: number | null;
  coverColor?: string | null;
  coverImageId?: string | null;
  metadata?: Record<string, unknown> | null;
  systemSourceType?: string | null;
  systemSourceId?: string | null;
  labelIds?: string[];
}

export interface UpdateCardSchema {
  id: string;
  boardId: string;
  columnId?: string;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  position?: number;
  assigneeId?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  estimatedMinutes?: number | null;
  coverColor?: string | null;
  coverImageId?: string | null;
  metadata?: Record<string, unknown> | null;
  archivedAt?: Date | null;
  labelIds?: string[];
}

export interface FindManyCardsOptions {
  boardId: string;
  columnId?: string;
  assigneeId?: string;
  reporterId?: string;
  labelIds?: string[];
  priority?: string;
  status?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  includeArchived?: boolean;
  parentCardId?: string | null;
  page?: number;
  limit?: number;
}

export interface FindManyCardsResult {
  cards: Card[];
  total: number;
}

export interface CardWithLabelIds {
  card: Card;
  labelIds: string[];
}

export interface CardsRepository {
  create(data: CreateCardSchema): Promise<Card>;
  findById(id: string, boardId: string): Promise<Card | null>;
  findByIdWithLabels(id: string, boardId: string): Promise<CardWithLabelIds | null>;
  findMany(options: FindManyCardsOptions): Promise<FindManyCardsResult>;
  findBySystemSource(
    tenantId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<Card | null>;
  findSubtasks(parentCardId: string): Promise<Card[]>;
  countByColumnId(columnId: string): Promise<number>;
  update(data: UpdateCardSchema): Promise<Card | null>;
  softDelete(id: string, boardId: string): Promise<void>;
}

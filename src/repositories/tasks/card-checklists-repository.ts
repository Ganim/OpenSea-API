export interface ChecklistItemRecord {
  id: string;
  checklistId: string;
  title: string;
  isCompleted: boolean;
  assigneeId: string | null;
  dueDate: Date | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardChecklistRecord {
  id: string;
  cardId: string;
  title: string;
  position: number;
  createdAt: Date;
  items: ChecklistItemRecord[];
}

export interface CreateCardChecklistSchema {
  cardId: string;
  title: string;
  position?: number;
}

export interface UpdateCardChecklistSchema {
  id: string;
  cardId: string;
  title?: string;
  position?: number;
}

export interface CreateChecklistItemSchema {
  checklistId: string;
  title: string;
  isCompleted?: boolean;
  assigneeId?: string | null;
  dueDate?: Date | null;
  position?: number;
}

export interface UpdateChecklistItemSchema {
  id: string;
  checklistId: string;
  title?: string;
  isCompleted?: boolean;
  assigneeId?: string | null;
  dueDate?: Date | null;
  position?: number;
}

export interface CardChecklistsRepository {
  create(data: CreateCardChecklistSchema): Promise<CardChecklistRecord>;
  findById(id: string, cardId: string): Promise<CardChecklistRecord | null>;
  findByCardId(cardId: string): Promise<CardChecklistRecord[]>;
  update(data: UpdateCardChecklistSchema): Promise<CardChecklistRecord | null>;
  delete(id: string, cardId: string): Promise<void>;
  addItem(data: CreateChecklistItemSchema): Promise<ChecklistItemRecord>;
  findItemById(
    id: string,
    checklistId: string,
  ): Promise<ChecklistItemRecord | null>;
  findItemsByChecklistId(checklistId: string): Promise<ChecklistItemRecord[]>;
  updateItem(
    data: UpdateChecklistItemSchema,
  ): Promise<ChecklistItemRecord | null>;
  deleteItem(id: string, checklistId: string): Promise<void>;
}

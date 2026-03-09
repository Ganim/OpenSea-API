import { randomUUID } from 'node:crypto';
import type {
  CardChecklistsRepository,
  CardChecklistRecord,
  ChecklistItemRecord,
  CreateCardChecklistSchema,
  UpdateCardChecklistSchema,
  CreateChecklistItemSchema,
  UpdateChecklistItemSchema,
} from '../card-checklists-repository';

export class InMemoryCardChecklistsRepository
  implements CardChecklistsRepository
{
  public checklists: Omit<CardChecklistRecord, 'items'>[] = [];
  public checklistItems: ChecklistItemRecord[] = [];

  private buildChecklistWithItems(
    checklist: Omit<CardChecklistRecord, 'items'>,
  ): CardChecklistRecord {
    const items = this.checklistItems
      .filter((item) => item.checklistId === checklist.id)
      .sort((a, b) => a.position - b.position);

    return { ...checklist, items };
  }

  async create(data: CreateCardChecklistSchema): Promise<CardChecklistRecord> {
    const checklist: Omit<CardChecklistRecord, 'items'> = {
      id: randomUUID(),
      cardId: data.cardId,
      title: data.title,
      position: data.position ?? 0,
      createdAt: new Date(),
    };

    this.checklists.push(checklist);
    return this.buildChecklistWithItems(checklist);
  }

  async findById(
    id: string,
    cardId: string,
  ): Promise<CardChecklistRecord | null> {
    const checklist = this.checklists.find(
      (cl) => cl.id === id && cl.cardId === cardId,
    );
    if (!checklist) return null;

    return this.buildChecklistWithItems(checklist);
  }

  async findByCardId(cardId: string): Promise<CardChecklistRecord[]> {
    return this.checklists
      .filter((cl) => cl.cardId === cardId)
      .sort((a, b) => a.position - b.position)
      .map((cl) => this.buildChecklistWithItems(cl));
  }

  async update(
    data: UpdateCardChecklistSchema,
  ): Promise<CardChecklistRecord | null> {
    const checklist = this.checklists.find(
      (cl) => cl.id === data.id && cl.cardId === data.cardId,
    );
    if (!checklist) return null;

    if (data.title !== undefined) checklist.title = data.title;
    if (data.position !== undefined) checklist.position = data.position;

    return this.buildChecklistWithItems(checklist);
  }

  async delete(id: string, cardId: string): Promise<void> {
    this.checklists = this.checklists.filter(
      (cl) => !(cl.id === id && cl.cardId === cardId),
    );
    this.checklistItems = this.checklistItems.filter(
      (item) => item.checklistId !== id,
    );
  }

  async addItem(data: CreateChecklistItemSchema): Promise<ChecklistItemRecord> {
    const now = new Date();
    const checklistItem: ChecklistItemRecord = {
      id: randomUUID(),
      checklistId: data.checklistId,
      title: data.title,
      isCompleted: data.isCompleted ?? false,
      assigneeId: data.assigneeId ?? null,
      dueDate: data.dueDate ?? null,
      position: data.position ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    this.checklistItems.push(checklistItem);
    return checklistItem;
  }

  async findItemById(
    id: string,
    checklistId: string,
  ): Promise<ChecklistItemRecord | null> {
    return (
      this.checklistItems.find(
        (item) => item.id === id && item.checklistId === checklistId,
      ) ?? null
    );
  }

  async findItemsByChecklistId(
    checklistId: string,
  ): Promise<ChecklistItemRecord[]> {
    return this.checklistItems
      .filter((item) => item.checklistId === checklistId)
      .sort((a, b) => a.position - b.position);
  }

  async updateItem(
    data: UpdateChecklistItemSchema,
  ): Promise<ChecklistItemRecord | null> {
    const checklistItem = this.checklistItems.find(
      (item) => item.id === data.id && item.checklistId === data.checklistId,
    );
    if (!checklistItem) return null;

    if (data.title !== undefined) checklistItem.title = data.title;
    if (data.isCompleted !== undefined)
      checklistItem.isCompleted = data.isCompleted;
    if (data.assigneeId !== undefined)
      checklistItem.assigneeId = data.assigneeId ?? null;
    if (data.dueDate !== undefined)
      checklistItem.dueDate = data.dueDate ?? null;
    if (data.position !== undefined) checklistItem.position = data.position;
    checklistItem.updatedAt = new Date();

    return checklistItem;
  }

  async deleteItem(id: string, checklistId: string): Promise<void> {
    this.checklistItems = this.checklistItems.filter(
      (item) => !(item.id === id && item.checklistId === checklistId),
    );
  }
}

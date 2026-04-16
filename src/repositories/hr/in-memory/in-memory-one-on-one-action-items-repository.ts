import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OneOnOneActionItem } from '@/entities/hr/one-on-one-action-item';
import type {
  CreateOneOnOneActionItemSchema,
  OneOnOneActionItemsRepository,
} from '../one-on-one-action-items-repository';

export class InMemoryOneOnOneActionItemsRepository
  implements OneOnOneActionItemsRepository
{
  public items: OneOnOneActionItem[] = [];

  async create(
    data: CreateOneOnOneActionItemSchema,
  ): Promise<OneOnOneActionItem> {
    const item = OneOnOneActionItem.create({
      meetingId: data.meetingId,
      ownerId: data.ownerId,
      content: data.content,
      isCompleted: false,
      dueDate: data.dueDate,
    });

    this.items.push(item);
    return item;
  }

  async findById(id: UniqueEntityID): Promise<OneOnOneActionItem | null> {
    return this.items.find((item) => item.id.equals(id)) ?? null;
  }

  async findManyByMeeting(
    meetingId: UniqueEntityID,
  ): Promise<OneOnOneActionItem[]> {
    return this.items
      .filter((item) => item.meetingId.equals(meetingId))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async save(item: OneOnOneActionItem): Promise<void> {
    const index = this.items.findIndex((current) => current.id.equals(item.id));
    if (index >= 0) {
      this.items[index] = item;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}

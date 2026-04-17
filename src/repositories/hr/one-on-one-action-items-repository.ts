import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneActionItem } from '@/entities/hr/one-on-one-action-item';

export interface CreateOneOnOneActionItemSchema {
  meetingId: UniqueEntityID;
  ownerId: UniqueEntityID;
  content: string;
  dueDate?: Date;
}

export interface OneOnOneActionItemsRepository {
  create(data: CreateOneOnOneActionItemSchema): Promise<OneOnOneActionItem>;
  findById(id: UniqueEntityID): Promise<OneOnOneActionItem | null>;
  findManyByMeeting(meetingId: UniqueEntityID): Promise<OneOnOneActionItem[]>;
  save(item: OneOnOneActionItem): Promise<void>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Conversation } from '@/entities/sales/conversation';
import type {
  ConversationsRepository,
  CreateConversationSchema,
} from '../conversations-repository';

export class InMemoryConversationsRepository
  implements ConversationsRepository
{
  public items: Conversation[] = [];

  async create(data: CreateConversationSchema): Promise<Conversation> {
    const conversation = Conversation.create({
      tenantId: new UniqueEntityID(data.tenantId),
      customerId: new UniqueEntityID(data.customerId),
      subject: data.subject,
      createdBy: data.createdBy,
      status: data.status,
    });

    this.items.push(conversation);
    return conversation;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Conversation | null> {
    const conversation = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return conversation ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<Conversation[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (item) =>
          !item.deletedAt &&
          item.tenantId.toString() === tenantId &&
          (!status || item.status === status),
      )
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )
      .slice(start, start + perPage);
  }

  async countByTenant(tenantId: string, status?: string): Promise<number> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.tenantId.toString() === tenantId &&
        (!status || item.status === status),
    ).length;
  }

  async save(conversation: Conversation): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(conversation.id),
    );

    if (index >= 0) {
      this.items[index] = conversation;
    } else {
      this.items.push(conversation);
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const conversation = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );

    if (conversation) {
      conversation.delete();
    }
  }
}

import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Conversation } from '@/entities/sales/conversation';

export interface CreateConversationSchema {
  tenantId: string;
  customerId: string;
  subject: string;
  createdBy: string;
  status?: 'OPEN' | 'CLOSED' | 'ARCHIVED';
}

export interface ConversationsRepository {
  create(data: CreateConversationSchema): Promise<Conversation>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Conversation | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<Conversation[]>;
  countByTenant(tenantId: string, status?: string): Promise<number>;
  save(conversation: Conversation): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}

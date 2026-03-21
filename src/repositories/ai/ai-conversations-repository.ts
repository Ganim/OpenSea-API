import type { AiConversation } from '@/entities/ai/ai-conversation';

export interface CreateConversationSchema {
  tenantId: string;
  userId: string;
  title?: string | null;
  context?: string;
  contextModule?: string | null;
  contextEntityType?: string | null;
  contextEntityId?: string | null;
}

export interface FindManyConversationsOptions {
  tenantId: string;
  userId: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FindManyConversationsResult {
  conversations: AiConversation[];
  total: number;
}

export interface AiConversationsRepository {
  create(data: CreateConversationSchema): Promise<AiConversation>;
  findById(id: string, tenantId: string): Promise<AiConversation | null>;
  findMany(options: FindManyConversationsOptions): Promise<FindManyConversationsResult>;
  archive(id: string, tenantId: string): Promise<void>;
  updateMessageCount(id: string, count: number, lastMessageAt: Date): Promise<void>;
}

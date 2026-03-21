import type { AiMessage } from '@/entities/ai/ai-message';

export interface CreateMessageSchema {
  conversationId: string;
  role: string;
  content?: string | null;
  contentType?: string;
  renderData?: Record<string, unknown> | null;
  attachments?: Record<string, unknown> | null;
  aiTier?: number | null;
  aiModel?: string | null;
  aiTokensInput?: number | null;
  aiTokensOutput?: number | null;
  aiLatencyMs?: number | null;
  aiCost?: number | null;
  toolCalls?: Record<string, unknown> | null;
  actionsTaken?: Record<string, unknown> | null;
  audioUrl?: string | null;
  transcription?: string | null;
}

export interface FindManyMessagesOptions {
  conversationId: string;
  page?: number;
  limit?: number;
}

export interface FindManyMessagesResult {
  messages: AiMessage[];
  total: number;
}

export interface AiMessagesRepository {
  create(data: CreateMessageSchema): Promise<AiMessage>;
  findMany(options: FindManyMessagesOptions): Promise<FindManyMessagesResult>;
}

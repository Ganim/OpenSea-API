import type { AiInsight } from '@/entities/ai/ai-insight';

export interface FindManyInsightsOptions {
  tenantId: string;
  userId?: string;
  status?: string;
  type?: string;
  priority?: string;
  module?: string;
  page?: number;
  limit?: number;
}

export interface FindManyInsightsResult {
  insights: AiInsight[];
  total: number;
}

export interface CreateInsightData {
  tenantId: string;
  type: string;
  priority: string;
  title: string;
  content: string;
  renderData?: Record<string, unknown> | null;
  module: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  targetUserIds: string[];
  actionUrl?: string | null;
  suggestedAction?: string | null;
  expiresAt?: Date | null;
  aiModel?: string | null;
}

export interface AiInsightsRepository {
  findById(id: string, tenantId: string): Promise<AiInsight | null>;
  findMany(options: FindManyInsightsOptions): Promise<FindManyInsightsResult>;
  create(data: CreateInsightData): Promise<AiInsight>;
  markViewed(id: string, tenantId: string): Promise<void>;
  markActedOn(id: string, tenantId: string): Promise<void>;
  dismiss(id: string, tenantId: string): Promise<void>;
}

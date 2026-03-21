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

export interface AiInsightsRepository {
  findById(id: string, tenantId: string): Promise<AiInsight | null>;
  findMany(options: FindManyInsightsOptions): Promise<FindManyInsightsResult>;
  markViewed(id: string, tenantId: string): Promise<void>;
  dismiss(id: string, tenantId: string): Promise<void>;
}

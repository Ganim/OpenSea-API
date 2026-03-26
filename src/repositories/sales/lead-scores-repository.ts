import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LeadScore } from '@/entities/sales/lead-score';

export interface CreateLeadScoreSchema {
  tenantId: string;
  customerId: string;
  score: number;
  tier: string;
  factors: unknown;
  calculatedAt: Date;
}

export interface LeadScoresRepository {
  upsert(data: CreateLeadScoreSchema): Promise<LeadScore>;
  findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<LeadScore | null>;
  findById(id: UniqueEntityID, tenantId: string): Promise<LeadScore | null>;
  findManyByTenant(tenantId: string): Promise<LeadScore[]>;
  deleteByCustomerId(tenantId: string, customerId: string): Promise<void>;
}

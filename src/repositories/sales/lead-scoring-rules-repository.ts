import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LeadScoringRule } from '@/entities/sales/lead-scoring-rule';

export interface CreateLeadScoringRuleSchema {
  tenantId: string;
  name: string;
  field: string;
  condition: string;
  value: string;
  points: number;
  isActive?: boolean;
}

export interface LeadScoringRulesRepository {
  create(data: CreateLeadScoringRuleSchema): Promise<LeadScoringRule>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<LeadScoringRule | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<LeadScoringRule[]>;
  findActiveByTenant(tenantId: string): Promise<LeadScoringRule[]>;
  countByTenant(tenantId: string): Promise<number>;
  save(scoringRule: LeadScoringRule): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}

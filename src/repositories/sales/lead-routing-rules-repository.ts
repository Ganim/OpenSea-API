import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  LeadRoutingRule,
  LeadRoutingStrategy,
} from '@/entities/sales/lead-routing-rule';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface CreateLeadRoutingRuleSchema {
  tenantId: string;
  name: string;
  strategy: LeadRoutingStrategy;
  config?: Record<string, unknown>;
  assignToUsers?: string[];
  maxLeadsPerUser?: number;
  isActive?: boolean;
}

export interface UpdateLeadRoutingRuleSchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  strategy?: LeadRoutingStrategy;
  config?: Record<string, unknown>;
  assignToUsers?: string[];
  maxLeadsPerUser?: number | null;
  isActive?: boolean;
}

export interface FindManyLeadRoutingRulesParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  strategy?: LeadRoutingStrategy;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LeadRoutingRulesRepository {
  create(data: CreateLeadRoutingRuleSchema): Promise<LeadRoutingRule>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<LeadRoutingRule | null>;
  findManyPaginated(
    params: FindManyLeadRoutingRulesParams,
  ): Promise<PaginatedResult<LeadRoutingRule>>;
  findActiveByTenant(tenantId: string): Promise<LeadRoutingRule[]>;
  update(data: UpdateLeadRoutingRuleSchema): Promise<LeadRoutingRule | null>;
  updateLastAssignedIndex(
    id: UniqueEntityID,
    tenantId: string,
    lastAssignedIndex: number,
  ): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}

import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceApprovalRule, FinanceApprovalAction } from '@/entities/finance/finance-approval-rule';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateFinanceApprovalRuleSchema {
  tenantId: string;
  name: string;
  isActive?: boolean;
  action: FinanceApprovalAction;
  maxAmount?: number;
  conditions?: Record<string, unknown>;
  priority?: number;
}

export interface UpdateFinanceApprovalRuleSchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  isActive?: boolean;
  action?: FinanceApprovalAction;
  maxAmount?: number | null;
  conditions?: Record<string, unknown>;
  priority?: number;
}

export interface FindManyApprovalRulesOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
  action?: FinanceApprovalAction;
}

export interface FindManyApprovalRulesResult {
  rules: FinanceApprovalRule[];
  total: number;
}

export interface FinanceApprovalRulesRepository {
  create(
    data: CreateFinanceApprovalRuleSchema,
    tx?: TransactionClient,
  ): Promise<FinanceApprovalRule>;

  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FinanceApprovalRule | null>;

  findByName(
    name: string,
    tenantId: string,
  ): Promise<FinanceApprovalRule | null>;

  findMany(
    options: FindManyApprovalRulesOptions,
  ): Promise<FindManyApprovalRulesResult>;

  findActiveByTenant(tenantId: string): Promise<FinanceApprovalRule[]>;

  update(
    data: UpdateFinanceApprovalRuleSchema,
    tx?: TransactionClient,
  ): Promise<FinanceApprovalRule | null>;

  incrementAppliedCount(
    id: UniqueEntityID,
    tx?: TransactionClient,
  ): Promise<void>;

  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}

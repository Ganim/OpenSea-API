import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OverdueAction } from '@/entities/finance/overdue-action';
import type {
  EscalationActionStatus,
  EscalationChannel,
} from '@/entities/finance/overdue-escalation-types';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateOverdueActionSchema {
  tenantId: string;
  entryId: string;
  stepId?: string;
  channel: EscalationChannel;
  status?: EscalationActionStatus;
}

export interface FindManyOverdueActionsOptions {
  tenantId: string;
  entryId?: string;
  stepId?: string;
  status?: EscalationActionStatus;
  page?: number;
  limit?: number;
}

export interface FindManyOverdueActionsResult {
  actions: OverdueAction[];
  total: number;
}

export interface OverdueActionsRepository {
  create(
    data: CreateOverdueActionSchema,
    tx?: TransactionClient,
  ): Promise<OverdueAction>;
  createMany(
    data: CreateOverdueActionSchema[],
    tx?: TransactionClient,
  ): Promise<OverdueAction[]>;
  findByEntryAndStep(
    entryId: string,
    stepId: string,
    tenantId: string,
  ): Promise<OverdueAction | null>;
  findMany(
    options: FindManyOverdueActionsOptions,
  ): Promise<FindManyOverdueActionsResult>;
  findByEntryId(entryId: string, tenantId: string): Promise<OverdueAction[]>;
  updateStatus(
    id: UniqueEntityID,
    status: EscalationActionStatus,
    error?: string,
    tx?: TransactionClient,
  ): Promise<void>;
}

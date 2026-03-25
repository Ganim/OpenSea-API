import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OverdueEscalation } from '@/entities/finance/overdue-escalation';
import type {
  EscalationChannel,
  EscalationTemplateType,
} from '@/entities/finance/overdue-escalation-types';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateOverdueEscalationStepSchema {
  daysOverdue: number;
  channel: EscalationChannel;
  templateType: EscalationTemplateType;
  subject?: string;
  message: string;
  isActive?: boolean;
  order: number;
}

export interface CreateOverdueEscalationSchema {
  tenantId: string;
  name: string;
  isDefault?: boolean;
  isActive?: boolean;
  steps: CreateOverdueEscalationStepSchema[];
}

export interface UpdateOverdueEscalationSchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
  steps?: CreateOverdueEscalationStepSchema[];
}

export interface FindManyEscalationsOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface FindManyEscalationsResult {
  escalations: OverdueEscalation[];
  total: number;
}

export interface OverdueEscalationsRepository {
  create(
    data: CreateOverdueEscalationSchema,
    tx?: TransactionClient,
  ): Promise<OverdueEscalation>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OverdueEscalation | null>;
  findByName(name: string, tenantId: string): Promise<OverdueEscalation | null>;
  findDefault(tenantId: string): Promise<OverdueEscalation | null>;
  findMany(
    options: FindManyEscalationsOptions,
  ): Promise<FindManyEscalationsResult>;
  update(
    data: UpdateOverdueEscalationSchema,
    tx?: TransactionClient,
  ): Promise<OverdueEscalation | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  clearDefault(
    tenantId: string,
    excludeId?: string,
    tx?: TransactionClient,
  ): Promise<void>;
}

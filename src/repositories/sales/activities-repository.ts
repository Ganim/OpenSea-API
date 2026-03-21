import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Activity, ActivityType } from '@/entities/sales/activity';
import type { PaginatedResult, PaginationParams } from '../pagination-params';

export interface CreateActivitySchema {
  tenantId: string;
  type: ActivityType;
  contactId?: string;
  customerId?: string;
  dealId?: string;
  title: string;
  description?: string;
  performedByUserId?: string;
  performedAt?: Date;
  dueAt?: Date;
  completedAt?: Date;
  duration?: number;
  outcome?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateActivitySchema {
  id: UniqueEntityID;
  tenantId: string;
  type?: ActivityType;
  title?: string;
  description?: string;
  performedAt?: Date;
  dueAt?: Date;
  completedAt?: Date;
  duration?: number;
  outcome?: string;
  metadata?: Record<string, unknown>;
}

export interface FindManyActivitiesOptions extends PaginationParams {
  tenantId: string;
  contactId?: string;
  customerId?: string;
  dealId?: string;
  type?: ActivityType;
  sortBy?: 'performedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ActivitiesRepository {
  create(data: CreateActivitySchema): Promise<Activity>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Activity | null>;
  findManyPaginated(
    options: FindManyActivitiesOptions,
  ): Promise<PaginatedResult<Activity>>;
  update(data: UpdateActivitySchema): Promise<Activity | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  count(tenantId: string): Promise<number>;
}

import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Objective } from '@/entities/hr/objective';

export interface CreateObjectiveSchema {
  tenantId: string;
  title: string;
  description?: string;
  ownerId: UniqueEntityID;
  parentId?: UniqueEntityID;
  level: string;
  status?: string;
  period: string;
  startDate: Date;
  endDate: Date;
  progress?: number;
}

export interface UpdateObjectiveSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  title?: string;
  description?: string;
  ownerId?: UniqueEntityID;
  parentId?: UniqueEntityID;
  level?: string;
  status?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
}

export interface FindObjectiveFilters {
  ownerId?: UniqueEntityID;
  parentId?: UniqueEntityID;
  level?: string;
  status?: string;
  period?: string;
  page?: number;
  perPage?: number;
}

export interface ObjectivesRepository {
  create(data: CreateObjectiveSchema): Promise<Objective>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Objective | null>;
  findMany(
    tenantId: string,
    filters?: FindObjectiveFilters,
  ): Promise<{ objectives: Objective[]; total: number }>;
  update(data: UpdateObjectiveSchema): Promise<Objective | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}

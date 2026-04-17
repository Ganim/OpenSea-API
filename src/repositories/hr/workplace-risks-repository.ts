import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkplaceRisk } from '@/entities/hr/workplace-risk';

export interface CreateWorkplaceRiskSchema {
  tenantId: string;
  safetyProgramId: UniqueEntityID;
  name: string;
  category: string;
  severity: string;
  source?: string;
  affectedArea?: string;
  controlMeasures?: string;
  epiRequired?: string;
  isActive?: boolean;
}

export interface UpdateWorkplaceRiskSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  name?: string;
  category?: string;
  severity?: string;
  source?: string;
  affectedArea?: string;
  controlMeasures?: string;
  epiRequired?: string;
  isActive?: boolean;
}

export interface FindWorkplaceRiskFilters {
  safetyProgramId?: UniqueEntityID;
  category?: string;
  severity?: string;
  isActive?: boolean;
  page?: number;
  perPage?: number;
}

export interface WorkplaceRisksRepository {
  create(data: CreateWorkplaceRiskSchema): Promise<WorkplaceRisk>;
  findById(id: UniqueEntityID, tenantId: string): Promise<WorkplaceRisk | null>;
  findMany(
    tenantId: string,
    filters?: FindWorkplaceRiskFilters,
  ): Promise<WorkplaceRisk[]>;
  update(data: UpdateWorkplaceRiskSchema): Promise<WorkplaceRisk | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}

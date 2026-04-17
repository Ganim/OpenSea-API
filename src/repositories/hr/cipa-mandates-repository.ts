import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMandate } from '@/entities/hr/cipa-mandate';

export interface CreateCipaMandateSchema {
  tenantId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status?: string;
  electionDate?: Date;
  notes?: string;
}

export interface UpdateCipaMandateSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  electionDate?: Date;
  notes?: string;
}

export interface FindCipaMandateFilters {
  status?: string;
  page?: number;
  perPage?: number;
}

export interface CipaMandatesRepository {
  create(data: CreateCipaMandateSchema): Promise<CipaMandate>;
  findById(id: UniqueEntityID, tenantId: string): Promise<CipaMandate | null>;
  findMany(
    tenantId: string,
    filters?: FindCipaMandateFilters,
  ): Promise<CipaMandate[]>;
  update(data: UpdateCipaMandateSchema): Promise<CipaMandate | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
  countMembers(mandateId: UniqueEntityID): Promise<number>;
}

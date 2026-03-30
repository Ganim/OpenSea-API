import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEAssignment } from '@/entities/hr/ppe-assignment';

export interface CreatePPEAssignmentSchema {
  tenantId: string;
  ppeItemId: string;
  employeeId: string;
  assignedAt?: Date;
  expiresAt?: Date;
  condition?: string;
  quantity: number;
  notes?: string;
}

export interface ReturnPPEAssignmentSchema {
  id: UniqueEntityID;
  returnCondition: string;
  notes?: string;
}

export interface FindPPEAssignmentFilters {
  employeeId?: string;
  ppeItemId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface FindExpiringAssignmentFilters {
  daysAhead: number;
  page?: number;
  perPage?: number;
}

export interface PPEAssignmentsRepository {
  create(data: CreatePPEAssignmentSchema): Promise<PPEAssignment>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PPEAssignment | null>;
  findMany(
    tenantId: string,
    filters?: FindPPEAssignmentFilters,
  ): Promise<{ assignments: PPEAssignment[]; total: number }>;
  findExpiring(
    tenantId: string,
    filters: FindExpiringAssignmentFilters,
  ): Promise<{ assignments: PPEAssignment[]; total: number }>;
  returnAssignment(
    data: ReturnPPEAssignmentSchema,
  ): Promise<PPEAssignment | null>;
}

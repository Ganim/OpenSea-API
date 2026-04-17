import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEAssignment } from '@/entities/hr/ppe-assignment';
import type { TransactionClient } from '@/lib/transaction-manager';

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
  /**
   * Accepts an optional `tx` so the assignment-create can be composed inside
   * a transaction with the stock-decrement — if either step fails both must
   * roll back together (see assign-ppe use case).
   */
  create(
    data: CreatePPEAssignmentSchema,
    tx?: TransactionClient,
  ): Promise<PPEAssignment>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PPEAssignment | null>;
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

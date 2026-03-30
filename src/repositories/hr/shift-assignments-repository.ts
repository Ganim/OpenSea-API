import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ShiftAssignment } from '@/entities/hr/shift-assignment';

export interface CreateShiftAssignmentSchema {
  tenantId: string;
  shiftId: string;
  employeeId: string;
  startDate: Date;
  endDate?: Date;
  isActive?: boolean;
  notes?: string;
}

export interface ShiftAssignmentsRepository {
  create(data: CreateShiftAssignmentSchema): Promise<ShiftAssignment>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ShiftAssignment | null>;
  findActiveByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<ShiftAssignment | null>;
  findManyByShift(
    shiftId: string,
    tenantId: string,
  ): Promise<ShiftAssignment[]>;
  findManyByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<ShiftAssignment[]>;
  deactivate(id: UniqueEntityID): Promise<ShiftAssignment | null>;
  delete(id: UniqueEntityID): Promise<void>;
}

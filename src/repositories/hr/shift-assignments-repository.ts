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
  /**
   * Phase 07 / Plan 07-05a — retorna o ShiftAssignment ativo que cobre `date`
   * (startDate <= date AND (endDate IS NULL OR endDate >= date)) com
   * `isActive=true`. Consumido pelo `DetectMissedPunchesUseCase` para saber
   * se o funcionário tinha expectativa de trabalhar naquele dia.
   */
  findActiveOnDate(
    employeeId: string,
    tenantId: string,
    date: Date,
  ): Promise<ShiftAssignment | null>;
  /**
   * Phase 07 / Plan 07-05a — conveniência booleana sobre `findActiveOnDate`.
   * Útil para gate ASCII em queries agregadas (ex.: heatmap).
   */
  existsForEmployeeOnDate(
    employeeId: string,
    tenantId: string,
    date: Date,
  ): Promise<boolean>;
  findManyByShift(
    shiftId: string,
    tenantId: string,
  ): Promise<ShiftAssignment[]>;
  findManyByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<ShiftAssignment[]>;
  deactivate(id: UniqueEntityID): Promise<ShiftAssignment | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}

import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Shift, ShiftType } from '@/entities/hr/shift';

export interface CreateShiftSchema {
  tenantId: string;
  name: string;
  code?: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isNightShift?: boolean;
  color?: string;
  isActive?: boolean;
}

export interface UpdateShiftSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  name?: string;
  code?: string | null;
  type?: ShiftType;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  isNightShift?: boolean;
  color?: string | null;
  isActive?: boolean;
}

export interface ShiftsRepository {
  create(data: CreateShiftSchema): Promise<Shift>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Shift | null>;
  findByName(name: string, tenantId: string): Promise<Shift | null>;
  findByCode(code: string, tenantId: string): Promise<Shift | null>;
  findMany(tenantId: string): Promise<Shift[]>;
  findManyActive(tenantId: string): Promise<Shift[]>;
  update(data: UpdateShiftSchema): Promise<Shift | null>;
  softDelete(id: UniqueEntityID): Promise<void>;
  countAssignments(shiftId: UniqueEntityID): Promise<number>;
}

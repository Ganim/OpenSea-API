import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TimeBank } from '@/entities/hr/time-bank';

export interface CreateTimeBankSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  balance: number;
  year: number;
}

export interface UpdateTimeBankSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  balance?: number;
}

export interface TimeBankRepository {
  create(data: CreateTimeBankSchema): Promise<TimeBank>;
  findById(id: UniqueEntityID, tenantId: string): Promise<TimeBank | null>;
  findByEmployeeAndYear(
    employeeId: UniqueEntityID,
    year: number,
    tenantId: string,
  ): Promise<TimeBank | null>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeBank[]>;
  findManyByYear(year: number, tenantId: string): Promise<TimeBank[]>;
  update(data: UpdateTimeBankSchema): Promise<TimeBank | null>;
  save(timeBank: TimeBank): Promise<void>;
  /**
   * Saves the TimeBank with optimistic locking.
   * Updates only if the version in DB matches the expectedVersion.
   * Returns true if the update succeeded, false if a version conflict occurred.
   */
  optimisticSave(timeBank: TimeBank, expectedVersion: number): Promise<boolean>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}

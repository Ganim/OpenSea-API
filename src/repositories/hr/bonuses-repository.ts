import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bonus } from '@/entities/hr/bonus';

export interface CreateBonusSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  name: string;
  amount: number;
  reason: string;
  date: Date;
}

export interface UpdateBonusSchema {
  id: UniqueEntityID;
  name?: string;
  amount?: number;
  reason?: string;
  date?: Date;
  isPaid?: boolean;
  paidAt?: Date;
  payrollId?: UniqueEntityID;
}

export interface FindBonusFilters {
  employeeId?: UniqueEntityID;
  isPaid?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface BonusesRepository {
  create(data: CreateBonusSchema): Promise<Bonus>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Bonus | null>;
  findMany(tenantId: string, filters?: FindBonusFilters): Promise<Bonus[]>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Bonus[]>;
  findManyPending(tenantId: string): Promise<Bonus[]>;
  findManyPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Bonus[]>;
  findPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Bonus[]>;
  findManyByPeriod(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Bonus[]>;
  sumPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<number>;
  update(data: UpdateBonusSchema): Promise<Bonus | null>;
  save(bonus: Bonus): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}

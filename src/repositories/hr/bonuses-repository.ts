import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bonus } from '@/entities/hr/bonus';

export interface CreateBonusSchema {
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
  findById(id: UniqueEntityID): Promise<Bonus | null>;
  findMany(filters?: FindBonusFilters): Promise<Bonus[]>;
  findManyByEmployee(employeeId: UniqueEntityID): Promise<Bonus[]>;
  findManyPending(): Promise<Bonus[]>;
  findManyPendingByEmployee(employeeId: UniqueEntityID): Promise<Bonus[]>;
  findPendingByEmployee(employeeId: UniqueEntityID): Promise<Bonus[]>;
  findManyByPeriod(startDate: Date, endDate: Date): Promise<Bonus[]>;
  sumPendingByEmployee(employeeId: UniqueEntityID): Promise<number>;
  update(data: UpdateBonusSchema): Promise<Bonus | null>;
  save(bonus: Bonus): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}

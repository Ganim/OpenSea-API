import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TimeBank } from '@/entities/hr/time-bank';

export interface CreateTimeBankSchema {
  employeeId: UniqueEntityID;
  balance: number;
  year: number;
}

export interface UpdateTimeBankSchema {
  id: UniqueEntityID;
  balance?: number;
}

export interface TimeBankRepository {
  create(data: CreateTimeBankSchema): Promise<TimeBank>;
  findById(id: UniqueEntityID): Promise<TimeBank | null>;
  findByEmployeeAndYear(
    employeeId: UniqueEntityID,
    year: number,
  ): Promise<TimeBank | null>;
  findManyByEmployee(employeeId: UniqueEntityID): Promise<TimeBank[]>;
  findManyByYear(year: number): Promise<TimeBank[]>;
  update(data: UpdateTimeBankSchema): Promise<TimeBank | null>;
  save(timeBank: TimeBank): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}

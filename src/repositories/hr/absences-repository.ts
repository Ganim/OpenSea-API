import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';

export interface CreateAbsenceSchema {
  employeeId: UniqueEntityID;
  type: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
  documentUrl?: string;
  cid?: string;
  isPaid: boolean;
  isInssResponsibility?: boolean;
  vacationPeriodId?: UniqueEntityID;
  requestedBy?: UniqueEntityID;
  notes?: string;
}

export interface UpdateAbsenceSchema {
  id: UniqueEntityID;
  status?: string;
  reason?: string;
  documentUrl?: string;
  cid?: string;
  approvedBy?: UniqueEntityID;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

export interface FindAbsenceFilters {
  employeeId?: UniqueEntityID;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AbsencesRepository {
  create(data: CreateAbsenceSchema): Promise<Absence>;
  findById(id: UniqueEntityID): Promise<Absence | null>;
  findMany(filters?: FindAbsenceFilters): Promise<Absence[]>;
  findManyByEmployee(employeeId: UniqueEntityID): Promise<Absence[]>;
  findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
  ): Promise<Absence[]>;
  findManyByStatus(status: string): Promise<Absence[]>;
  findManyPending(): Promise<Absence[]>;
  findOverlapping(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    excludeId?: UniqueEntityID,
  ): Promise<Absence[]>;
  countByEmployeeAndType(
    employeeId: UniqueEntityID,
    type: string,
    year: number,
  ): Promise<number>;
  sumDaysByEmployeeAndType(
    employeeId: UniqueEntityID,
    type: string,
    year: number,
  ): Promise<number>;
  update(data: UpdateAbsenceSchema): Promise<Absence | null>;
  save(absence: Absence): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}

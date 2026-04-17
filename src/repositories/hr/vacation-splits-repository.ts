import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  VacationSplit,
  VacationSplitStatus,
} from '@/entities/hr/vacation-split';

export interface CreateVacationSplitSchema {
  vacationPeriodId: string;
  splitNumber: number;
  startDate: Date;
  endDate: Date;
  days: number;
  status?: VacationSplitStatus;
  paymentDate?: Date;
  paymentAmount?: number;
}

export interface VacationSplitsRepository {
  create(data: CreateVacationSplitSchema): Promise<VacationSplit>;
  findById(id: UniqueEntityID): Promise<VacationSplit | null>;
  findByVacationPeriodId(vacationPeriodId: string): Promise<VacationSplit[]>;
  findActiveByVacationPeriodId(
    vacationPeriodId: string,
  ): Promise<VacationSplit[]>;
  countActiveByVacationPeriodId(vacationPeriodId: string): Promise<number>;
  save(split: VacationSplit): Promise<void>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}

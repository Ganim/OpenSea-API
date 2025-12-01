import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkSchedule } from '@/entities/hr/work-schedule';

export interface CreateWorkScheduleSchema {
  name: string;
  description?: string;
  mondayStart?: string;
  mondayEnd?: string;
  tuesdayStart?: string;
  tuesdayEnd?: string;
  wednesdayStart?: string;
  wednesdayEnd?: string;
  thursdayStart?: string;
  thursdayEnd?: string;
  fridayStart?: string;
  fridayEnd?: string;
  saturdayStart?: string;
  saturdayEnd?: string;
  sundayStart?: string;
  sundayEnd?: string;
  breakDuration: number;
  isActive?: boolean;
}

export interface UpdateWorkScheduleSchema {
  id: UniqueEntityID;
  name?: string;
  description?: string | null;
  mondayStart?: string | null;
  mondayEnd?: string | null;
  tuesdayStart?: string | null;
  tuesdayEnd?: string | null;
  wednesdayStart?: string | null;
  wednesdayEnd?: string | null;
  thursdayStart?: string | null;
  thursdayEnd?: string | null;
  fridayStart?: string | null;
  fridayEnd?: string | null;
  saturdayStart?: string | null;
  saturdayEnd?: string | null;
  sundayStart?: string | null;
  sundayEnd?: string | null;
  breakDuration?: number;
  isActive?: boolean;
}

export interface WorkSchedulesRepository {
  create(data: CreateWorkScheduleSchema): Promise<WorkSchedule>;
  findById(id: UniqueEntityID): Promise<WorkSchedule | null>;
  findByName(name: string): Promise<WorkSchedule | null>;
  findMany(): Promise<WorkSchedule[]>;
  findManyActive(): Promise<WorkSchedule[]>;
  update(data: UpdateWorkScheduleSchema): Promise<WorkSchedule | null>;
  save(workSchedule: WorkSchedule): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}

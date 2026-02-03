import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkSchedule } from '@/entities/hr/work-schedule';
import type {
  CreateWorkScheduleSchema,
  UpdateWorkScheduleSchema,
  WorkSchedulesRepository,
} from '../work-schedules-repository';

export class InMemoryWorkSchedulesRepository
  implements WorkSchedulesRepository
{
  private items: WorkSchedule[] = [];

  async create(data: CreateWorkScheduleSchema): Promise<WorkSchedule> {
    const id = new UniqueEntityID();
    const workSchedule = WorkSchedule.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        name: data.name,
        description: data.description,
        mondayStart: data.mondayStart,
        mondayEnd: data.mondayEnd,
        tuesdayStart: data.tuesdayStart,
        tuesdayEnd: data.tuesdayEnd,
        wednesdayStart: data.wednesdayStart,
        wednesdayEnd: data.wednesdayEnd,
        thursdayStart: data.thursdayStart,
        thursdayEnd: data.thursdayEnd,
        fridayStart: data.fridayStart,
        fridayEnd: data.fridayEnd,
        saturdayStart: data.saturdayStart,
        saturdayEnd: data.saturdayEnd,
        sundayStart: data.sundayStart,
        sundayEnd: data.sundayEnd,
        breakDuration: data.breakDuration,
        isActive: data.isActive ?? true,
      },
      id,
    );

    this.items.push(workSchedule);
    return workSchedule;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<WorkSchedule | null> {
    const workSchedule = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return workSchedule || null;
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<WorkSchedule | null> {
    const workSchedule = this.items.find(
      (item) => item.name === name && item.tenantId.toString() === tenantId,
    );
    return workSchedule || null;
  }

  async findMany(tenantId: string): Promise<WorkSchedule[]> {
    return this.items.filter((item) => item.tenantId.toString() === tenantId);
  }

  async findManyActive(tenantId: string): Promise<WorkSchedule[]> {
    return this.items.filter(
      (item) => item.isActive && item.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateWorkScheduleSchema): Promise<WorkSchedule | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) return null;

    const existing = this.items[index];

    const updated = WorkSchedule.create(
      {
        tenantId: existing.tenantId,
        name: data.name ?? existing.name,
        description:
          data.description !== undefined
            ? (data.description ?? undefined)
            : existing.description,
        mondayStart:
          data.mondayStart !== undefined
            ? (data.mondayStart ?? undefined)
            : existing.mondayStart,
        mondayEnd:
          data.mondayEnd !== undefined
            ? (data.mondayEnd ?? undefined)
            : existing.mondayEnd,
        tuesdayStart:
          data.tuesdayStart !== undefined
            ? (data.tuesdayStart ?? undefined)
            : existing.tuesdayStart,
        tuesdayEnd:
          data.tuesdayEnd !== undefined
            ? (data.tuesdayEnd ?? undefined)
            : existing.tuesdayEnd,
        wednesdayStart:
          data.wednesdayStart !== undefined
            ? (data.wednesdayStart ?? undefined)
            : existing.wednesdayStart,
        wednesdayEnd:
          data.wednesdayEnd !== undefined
            ? (data.wednesdayEnd ?? undefined)
            : existing.wednesdayEnd,
        thursdayStart:
          data.thursdayStart !== undefined
            ? (data.thursdayStart ?? undefined)
            : existing.thursdayStart,
        thursdayEnd:
          data.thursdayEnd !== undefined
            ? (data.thursdayEnd ?? undefined)
            : existing.thursdayEnd,
        fridayStart:
          data.fridayStart !== undefined
            ? (data.fridayStart ?? undefined)
            : existing.fridayStart,
        fridayEnd:
          data.fridayEnd !== undefined
            ? (data.fridayEnd ?? undefined)
            : existing.fridayEnd,
        saturdayStart:
          data.saturdayStart !== undefined
            ? (data.saturdayStart ?? undefined)
            : existing.saturdayStart,
        saturdayEnd:
          data.saturdayEnd !== undefined
            ? (data.saturdayEnd ?? undefined)
            : existing.saturdayEnd,
        sundayStart:
          data.sundayStart !== undefined
            ? (data.sundayStart ?? undefined)
            : existing.sundayStart,
        sundayEnd:
          data.sundayEnd !== undefined
            ? (data.sundayEnd ?? undefined)
            : existing.sundayEnd,
        breakDuration: data.breakDuration ?? existing.breakDuration,
        isActive: data.isActive ?? existing.isActive,
      },
      existing.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async save(workSchedule: WorkSchedule): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(workSchedule.id),
    );

    if (index !== -1) {
      this.items[index] = workSchedule;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}

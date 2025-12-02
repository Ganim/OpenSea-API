import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkSchedule } from '@/entities/hr/work-schedule';
import { prisma } from '@/lib/prisma';
import { mapWorkSchedulePrismaToDomain } from '@/mappers/hr/work-schedule';
import type {
  CreateWorkScheduleSchema,
  UpdateWorkScheduleSchema,
  WorkSchedulesRepository,
} from '../work-schedules-repository';

export class PrismaWorkSchedulesRepository implements WorkSchedulesRepository {
  async create(data: CreateWorkScheduleSchema): Promise<WorkSchedule> {
    const workScheduleData = await prisma.workSchedule.create({
      data: {
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
    });

    const workSchedule = WorkSchedule.create(
      mapWorkSchedulePrismaToDomain(workScheduleData),
      new UniqueEntityID(workScheduleData.id),
    );
    return workSchedule;
  }

  async findById(id: UniqueEntityID): Promise<WorkSchedule | null> {
    const workScheduleData = await prisma.workSchedule.findUnique({
      where: { id: id.toString() },
    });

    if (!workScheduleData) return null;

    const workSchedule = WorkSchedule.create(
      mapWorkSchedulePrismaToDomain(workScheduleData),
      new UniqueEntityID(workScheduleData.id),
    );
    return workSchedule;
  }

  async findByName(name: string): Promise<WorkSchedule | null> {
    const workScheduleData = await prisma.workSchedule.findFirst({
      where: { name },
    });

    if (!workScheduleData) return null;

    const workSchedule = WorkSchedule.create(
      mapWorkSchedulePrismaToDomain(workScheduleData),
      new UniqueEntityID(workScheduleData.id),
    );
    return workSchedule;
  }

  async findMany(): Promise<WorkSchedule[]> {
    const workSchedules = await prisma.workSchedule.findMany({
      orderBy: { name: 'asc' },
    });

    return workSchedules.map((schedule) =>
      WorkSchedule.create(
        mapWorkSchedulePrismaToDomain(schedule),
        new UniqueEntityID(schedule.id),
      ),
    );
  }

  async findManyActive(): Promise<WorkSchedule[]> {
    const workSchedules = await prisma.workSchedule.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return workSchedules.map((schedule) =>
      WorkSchedule.create(
        mapWorkSchedulePrismaToDomain(schedule),
        new UniqueEntityID(schedule.id),
      ),
    );
  }

  async update(data: UpdateWorkScheduleSchema): Promise<WorkSchedule | null> {
    const existingSchedule = await prisma.workSchedule.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingSchedule) return null;

    const workScheduleData = await prisma.workSchedule.update({
      where: { id: data.id.toString() },
      data: {
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
        isActive: data.isActive,
      },
    });

    const workSchedule = WorkSchedule.create(
      mapWorkSchedulePrismaToDomain(workScheduleData),
      new UniqueEntityID(workScheduleData.id),
    );
    return workSchedule;
  }

  async save(workSchedule: WorkSchedule): Promise<void> {
    await prisma.workSchedule.update({
      where: { id: workSchedule.id.toString() },
      data: {
        name: workSchedule.name,
        description: workSchedule.description,
        mondayStart: workSchedule.mondayStart,
        mondayEnd: workSchedule.mondayEnd,
        tuesdayStart: workSchedule.tuesdayStart,
        tuesdayEnd: workSchedule.tuesdayEnd,
        wednesdayStart: workSchedule.wednesdayStart,
        wednesdayEnd: workSchedule.wednesdayEnd,
        thursdayStart: workSchedule.thursdayStart,
        thursdayEnd: workSchedule.thursdayEnd,
        fridayStart: workSchedule.fridayStart,
        fridayEnd: workSchedule.fridayEnd,
        saturdayStart: workSchedule.saturdayStart,
        saturdayEnd: workSchedule.saturdayEnd,
        sundayStart: workSchedule.sundayStart,
        sundayEnd: workSchedule.sundayEnd,
        breakDuration: workSchedule.breakDuration,
        isActive: workSchedule.isActive,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.workSchedule.delete({
      where: { id: id.toString() },
    });
  }
}

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Overtime } from '@/entities/hr/overtime';
import { prisma } from '@/lib/prisma';
import { mapOvertimePrismaToDomain } from '@/mappers/hr/overtime';
import type {
  CreateOvertimeSchema,
  FindOvertimeFilters,
  OvertimeRepository,
  UpdateOvertimeSchema,
} from '../overtime-repository';

export class PrismaOvertimeRepository implements OvertimeRepository {
  async create(data: CreateOvertimeSchema): Promise<Overtime> {
    const overtimeData = await prisma.overtime.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        date: data.date,
        hours: data.hours,
        reason: data.reason,
        approved: false,
      },
    });

    const overtime = Overtime.create(
      mapOvertimePrismaToDomain(overtimeData),
      new UniqueEntityID(overtimeData.id),
    );
    return overtime;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Overtime | null> {
    const overtimeData = await prisma.overtime.findUnique({
      where: { id: id.toString(), tenantId },
    });

    if (!overtimeData) return null;

    const overtime = Overtime.create(
      mapOvertimePrismaToDomain(overtimeData),
      new UniqueEntityID(overtimeData.id),
    );
    return overtime;
  }

  async findMany(
    tenantId: string,
    filters?: FindOvertimeFilters,
  ): Promise<Overtime[]> {
    const overtimes = await prisma.overtime.findMany({
      where: {
        tenantId,
        employeeId: filters?.employeeId?.toString(),
        date: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
        approved: filters?.approved,
      },
      orderBy: { date: 'desc' },
    });

    return overtimes.map((overtimeRecord) =>
      Overtime.create(
        mapOvertimePrismaToDomain(overtimeRecord),
        new UniqueEntityID(overtimeRecord.id),
      ),
    );
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Overtime[]> {
    const overtimes = await prisma.overtime.findMany({
      where: { employeeId: employeeId.toString(), tenantId },
      orderBy: { date: 'desc' },
    });

    return overtimes.map((overtimeRecord) =>
      Overtime.create(
        mapOvertimePrismaToDomain(overtimeRecord),
        new UniqueEntityID(overtimeRecord.id),
      ),
    );
  }

  async findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Overtime[]> {
    const overtimes = await prisma.overtime.findMany({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return overtimes.map((overtimeRecord) =>
      Overtime.create(
        mapOvertimePrismaToDomain(overtimeRecord),
        new UniqueEntityID(overtimeRecord.id),
      ),
    );
  }

  async findManyPending(tenantId: string): Promise<Overtime[]> {
    const overtimes = await prisma.overtime.findMany({
      where: { approved: false, tenantId },
      orderBy: { date: 'desc' },
    });

    return overtimes.map((overtimeRecord) =>
      Overtime.create(
        mapOvertimePrismaToDomain(overtimeRecord),
        new UniqueEntityID(overtimeRecord.id),
      ),
    );
  }

  async findManyApproved(tenantId: string): Promise<Overtime[]> {
    const overtimes = await prisma.overtime.findMany({
      where: { approved: true, tenantId },
      orderBy: { date: 'desc' },
    });

    return overtimes.map((overtimeRecord) =>
      Overtime.create(
        mapOvertimePrismaToDomain(overtimeRecord),
        new UniqueEntityID(overtimeRecord.id),
      ),
    );
  }

  async update(data: UpdateOvertimeSchema): Promise<Overtime | null> {
    const existingOvertime = await prisma.overtime.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingOvertime) return null;

    const overtimeData = await prisma.overtime.update({
      where: { id: data.id.toString() },
      data: {
        date: data.date,
        hours: data.hours,
        reason: data.reason,
        approved: data.approved,
        approvedBy: data.approvedBy?.toString(),
        approvedAt: data.approvedAt,
      },
    });

    const overtime = Overtime.create(
      mapOvertimePrismaToDomain(overtimeData),
      new UniqueEntityID(overtimeData.id),
    );
    return overtime;
  }

  async save(overtime: Overtime): Promise<void> {
    await prisma.overtime.update({
      where: { id: overtime.id.toString() },
      data: {
        date: overtime.date,
        hours: overtime.hours,
        reason: overtime.reason,
        approved: overtime.approved,
        approvedBy: overtime.approvedBy?.toString(),
        approvedAt: overtime.approvedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.overtime.delete({
      where: { id: id.toString() },
    });
  }
}

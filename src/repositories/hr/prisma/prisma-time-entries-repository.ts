import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import { prisma } from '@/lib/prisma';
import { mapTimeEntryPrismaToDomain } from '@/mappers/hr/time-entry';
import type { TimeEntryType as PrismaTimeEntryType } from '@prisma/generated/client.js';
import type {
  CreateTimeEntrySchema,
  FindManyTimeEntriesResult,
  FindTimeEntriesFilters,
  TimeEntriesRepository,
} from '../time-entries-repository';

export class PrismaTimeEntriesRepository implements TimeEntriesRepository {
  async create(data: CreateTimeEntrySchema): Promise<TimeEntry> {
    const timeEntryData = await prisma.timeEntry.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        entryType: data.entryType.value as PrismaTimeEntryType,
        timestamp: data.timestamp,
        latitude: data.latitude,
        longitude: data.longitude,
        ipAddress: data.ipAddress,
        notes: data.notes,
      },
    });

    const timeEntry = TimeEntry.create(
      mapTimeEntryPrismaToDomain(timeEntryData),
      new UniqueEntityID(timeEntryData.id),
    );
    return timeEntry;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry | null> {
    const timeEntryData = await prisma.timeEntry.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!timeEntryData) return null;

    const timeEntry = TimeEntry.create(
      mapTimeEntryPrismaToDomain(timeEntryData),
      new UniqueEntityID(timeEntryData.id),
    );
    return timeEntry;
  }

  async findMany(filters: FindTimeEntriesFilters): Promise<FindManyTimeEntriesResult> {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 50;
    const skip = (page - 1) * perPage;

    const where = {
      tenantId: filters.tenantId,
      employeeId: filters?.employeeId?.toString(),
      timestamp: {
        gte: filters?.startDate,
        lte: filters?.endDate,
      },
      entryType: filters?.entryType?.value as PrismaTimeEntryType | undefined,
    };

    const [timeEntriesData, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.timeEntry.count({ where }),
    ]);

    const timeEntries = timeEntriesData.map((entry) =>
      TimeEntry.create(
        mapTimeEntryPrismaToDomain(entry),
        new UniqueEntityID(entry.id),
      ),
    );

    return { timeEntries, total };
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry[]> {
    const timeEntries = await prisma.timeEntry.findMany({
      where: { employeeId: employeeId.toString(), tenantId },
      orderBy: { timestamp: 'desc' },
    });

    return timeEntries.map((entry) =>
      TimeEntry.create(
        mapTimeEntryPrismaToDomain(entry),
        new UniqueEntityID(entry.id),
      ),
    );
  }

  async findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<TimeEntry[]> {
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return timeEntries.map((entry) =>
      TimeEntry.create(
        mapTimeEntryPrismaToDomain(entry),
        new UniqueEntityID(entry.id),
      ),
    );
  }

  async findLastEntryByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry | null> {
    const timeEntryData = await prisma.timeEntry.findFirst({
      where: { employeeId: employeeId.toString(), tenantId },
      orderBy: { timestamp: 'desc' },
    });

    if (!timeEntryData) return null;

    const timeEntry = TimeEntry.create(
      mapTimeEntryPrismaToDomain(timeEntryData),
      new UniqueEntityID(timeEntryData.id),
    );
    return timeEntry;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.timeEntry.delete({
      where: { id: id.toString() },
    });
  }
}

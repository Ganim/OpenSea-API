import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import { prisma } from '@/lib/prisma';
import { mapTimeEntryPrismaToDomain } from '@/mappers/hr/time-entry';
import type { TimeEntryType as PrismaTimeEntryType } from '@prisma/client';
import type {
  CreateTimeEntrySchema,
  FindTimeEntriesFilters,
  TimeEntriesRepository,
} from '../time-entries-repository';

export class PrismaTimeEntriesRepository implements TimeEntriesRepository {
  async create(data: CreateTimeEntrySchema): Promise<TimeEntry> {
    const timeEntryData = await prisma.timeEntry.create({
      data: {
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

  async findById(id: UniqueEntityID): Promise<TimeEntry | null> {
    const timeEntryData = await prisma.timeEntry.findUnique({
      where: { id: id.toString() },
    });

    if (!timeEntryData) return null;

    const timeEntry = TimeEntry.create(
      mapTimeEntryPrismaToDomain(timeEntryData),
      new UniqueEntityID(timeEntryData.id),
    );
    return timeEntry;
  }

  async findMany(filters?: FindTimeEntriesFilters): Promise<TimeEntry[]> {
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: filters?.employeeId?.toString(),
        timestamp: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
        entryType: filters?.entryType?.value as PrismaTimeEntryType | undefined,
      },
      orderBy: { timestamp: 'desc' },
    });

    return timeEntries.map((entry) =>
      TimeEntry.create(
        mapTimeEntryPrismaToDomain(entry),
        new UniqueEntityID(entry.id),
      ),
    );
  }

  async findManyByEmployee(employeeId: UniqueEntityID): Promise<TimeEntry[]> {
    const timeEntries = await prisma.timeEntry.findMany({
      where: { employeeId: employeeId.toString() },
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
  ): Promise<TimeEntry[]> {
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: employeeId.toString(),
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
  ): Promise<TimeEntry | null> {
    const timeEntryData = await prisma.timeEntry.findFirst({
      where: { employeeId: employeeId.toString() },
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

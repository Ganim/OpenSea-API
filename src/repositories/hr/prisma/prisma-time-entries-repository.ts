import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import { prisma } from '@/lib/prisma';
import { mapTimeEntryPrismaToDomain } from '@/mappers/hr/time-entry';
import {
  Prisma,
  TimeEntryType as PrismaTimeEntryType,
} from '@prisma/generated/client.js';
import type {
  CreateTimeEntrySchema,
  FindManyTimeEntriesResult,
  FindTimeEntriesFilters,
  TimeEntriesRepository,
} from '../time-entries-repository';

const NSR_MAX_RETRIES = 10;

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
        nsrNumber: data.nsrNumber,
        requestId: data.requestId,
        // Phase 5 (Plan 05-07 / D-04): audit-only kiosk signals (liveness, ...).
        metadata:
          data.metadata === undefined
            ? undefined
            : (data.metadata as Prisma.InputJsonValue | null),
      },
    });

    const timeEntry = TimeEntry.create(
      mapTimeEntryPrismaToDomain(timeEntryData),
      new UniqueEntityID(timeEntryData.id),
    );
    return timeEntry;
  }

  async createWithSequentialNsr(
    data: Omit<CreateTimeEntrySchema, 'nsrNumber'>,
  ): Promise<TimeEntry> {
    // Portaria 671 Anexo III requires unique, strictly increasing NSR per
    // tenant. The DB enforces @@unique([tenantId, nsrNumber]); if two
    // concurrent punches compute the same next NSR, the loser retries.
    let attempt = 0;
    let currentMax = await this.findMaxNsrNumber(data.tenantId);

    while (attempt < NSR_MAX_RETRIES) {
      const nsrNumber = currentMax + 1;
      try {
        return await this.create({ ...data, nsrNumber });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          attempt += 1;
          // Refresh max and retry with next value
          currentMax = await this.findMaxNsrNumber(data.tenantId);
          continue;
        }
        throw err;
      }
    }

    throw new Error(
      `Não foi possível alocar NSR único após ${NSR_MAX_RETRIES} tentativas.`,
    );
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

  async findMany(
    filters: FindTimeEntriesFilters,
  ): Promise<FindManyTimeEntriesResult> {
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

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.timeEntry.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
    });
  }

  async findMaxNsrNumber(tenantId: string): Promise<number> {
    const result = await prisma.timeEntry.aggregate({
      where: { tenantId },
      _max: { nsrNumber: true },
    });

    return result._max.nsrNumber ?? 0;
  }

  async findByRequestId(
    tenantId: string,
    employeeId: string,
    requestId: string,
  ): Promise<TimeEntry | null> {
    // Pitfall 3: requestId is nullable on the column. Using findUnique on
    // the composite `(tenantId, employeeId, requestId)` would be ambiguous
    // for legacy rows where requestId IS NULL — findFirst with an explicit
    // `requestId: requestId` clause sidesteps that entirely.
    const timeEntryData = await prisma.timeEntry.findFirst({
      where: { tenantId, employeeId, requestId },
    });

    if (!timeEntryData) return null;

    return TimeEntry.create(
      mapTimeEntryPrismaToDomain(timeEntryData),
      new UniqueEntityID(timeEntryData.id),
    );
  }
}

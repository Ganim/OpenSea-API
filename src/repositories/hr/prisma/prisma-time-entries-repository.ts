import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import { prisma } from '@/lib/prisma';
import { mapTimeEntryPrismaToDomain } from '@/mappers/hr/time-entry';
import {
  AdjustmentType as PrismaAdjustmentType,
  Prisma,
  TimeEntryType as PrismaTimeEntryType,
} from '@prisma/generated/client.js';
import type {
  CreateTimeEntryAdjustmentParams,
  CreateTimeEntryAdjustmentResult,
  CreateTimeEntrySchema,
  FindManyTimeEntriesResult,
  FindTimeEntriesFilters,
  TimeEntriesRepository,
  TimeEntryForReceiptLookup,
  UpdateReceiptMetadataParams,
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
  ): Promise<{ timeEntry: TimeEntry; nsrNumber: number }> {
    // Portaria 671 Anexo III requires unique, strictly increasing NSR per
    // tenant. The DB enforces @@unique([tenantId, nsrNumber]); if two
    // concurrent punches compute the same next NSR, the loser retries.
    let attempt = 0;
    let currentMax = await this.findMaxNsrNumber(data.tenantId);

    while (attempt < NSR_MAX_RETRIES) {
      const nsrNumber = currentMax + 1;
      try {
        const timeEntry = await this.create({ ...data, nsrNumber });
        return { timeEntry, nsrNumber };
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
  ): Promise<{ timeEntry: TimeEntry; nsrNumber: number } | null> {
    // Pitfall 3: requestId is nullable on the column. Using findUnique on
    // the composite `(tenantId, employeeId, requestId)` would be ambiguous
    // for legacy rows where requestId IS NULL — findFirst with an explicit
    // `requestId: requestId` clause sidesteps that entirely.
    const timeEntryData = await prisma.timeEntry.findFirst({
      where: { tenantId, employeeId, requestId },
    });

    if (!timeEntryData) return null;

    const timeEntry = TimeEntry.create(
      mapTimeEntryPrismaToDomain(timeEntryData),
      new UniqueEntityID(timeEntryData.id),
    );
    return { timeEntry, nsrNumber: timeEntryData.nsrNumber };
  }

  async createAdjustment(
    params: CreateTimeEntryAdjustmentParams,
  ): Promise<CreateTimeEntryAdjustmentResult> {
    return prisma.$transaction(async (tx) => {
      const origin = await tx.timeEntry.findFirst({
        where: { id: params.originEntryId, tenantId: params.tenantId },
        select: { id: true, nsrNumber: true, tenantId: true },
      });

      if (!origin) {
        throw new Error(
          `TimeEntry origem não encontrada (id=${params.originEntryId}, tenant=${params.tenantId}).`,
        );
      }
      if (origin.nsrNumber == null) {
        throw new Error(
          `TimeEntry origem ${params.originEntryId} sem nsrNumber — Portaria 671 exige NSR válido na origem.`,
        );
      }

      // Idempotência por requestId.
      if (params.requestId) {
        const existing = await tx.timeEntry.findFirst({
          where: {
            tenantId: params.tenantId,
            requestId: params.requestId,
          },
        });
        if (existing && existing.nsrNumber != null) {
          return {
            timeEntry: TimeEntry.create(
              mapTimeEntryPrismaToDomain(existing),
              new UniqueEntityID(existing.id),
            ),
            nsrNumber: existing.nsrNumber,
            originNsrNumber: origin.nsrNumber,
          };
        }
      }

      // Aloca próximo NSR sob a transação. Em concorrência o constraint
      // @@unique([tenantId, nsrNumber]) protege; o caller deve ter retry
      // se necessário (CreateAdjustment é tipicamente fluxo manual de gestor,
      // contenção esperada baixa).
      const aggregate = await tx.timeEntry.aggregate({
        where: { tenantId: params.tenantId },
        _max: { nsrNumber: true },
      });
      const nextNsr = (aggregate._max.nsrNumber ?? 0) + 1;

      const created = await tx.timeEntry.create({
        data: {
          tenantId: params.tenantId,
          employeeId: params.employeeId.toString(),
          entryType: params.entryType.value as PrismaTimeEntryType,
          timestamp: params.timestamp,
          notes: params.note,
          requestId: params.requestId,
          nsrNumber: nextNsr,
          originNsrNumber: origin.nsrNumber,
          adjustmentType: PrismaAdjustmentType.ADJUSTMENT_APPROVED,
          // Audit-only: who resolved the correction. Lives in the JSONB
          // metadata column added in Plan 05-07; never queried back.
          metadata: {
            resolverUserId: params.resolverUserId,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        timeEntry: TimeEntry.create(
          mapTimeEntryPrismaToDomain(created),
          new UniqueEntityID(created.id),
        ),
        nsrNumber: nextNsr,
        originNsrNumber: origin.nsrNumber,
      };
    });
  }

  async findByReceiptVerifyHash(
    nsrHash: string,
  ): Promise<TimeEntryForReceiptLookup | null> {
    // Pitfall 8: findFirst (NÃO findUnique) — a coluna é nullable (batidas
    // criadas ANTES do worker do Plan 06-03 carregam NULL), e findUnique em
    // nullable field pode produzir ambiguidade. findFirst com WHERE explícito
    // é robusto.
    const row = await prisma.timeEntry.findFirst({
      where: { receiptVerifyHash: nsrHash },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        entryType: true,
        timestamp: true,
        nsrNumber: true,
        punchApproval: { select: { status: true } },
      },
    });

    if (!row || row.nsrNumber == null) return null;

    // BREAK_START/BREAK_END/CLOCK_IN/CLOCK_OUT — os 4 tipos que o recibo
    // público reconhece. OVERTIME_START/END ficam fora (rotas de horas extras
    // não geram recibo público nesta fase).
    const allowed: TimeEntryForReceiptLookup['entryType'][] = [
      'CLOCK_IN',
      'CLOCK_OUT',
      'BREAK_START',
      'BREAK_END',
    ];
    if (
      !allowed.includes(row.entryType as TimeEntryForReceiptLookup['entryType'])
    ) {
      return null;
    }

    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      entryType: row.entryType as TimeEntryForReceiptLookup['entryType'],
      timestamp: row.timestamp,
      nsrNumber: row.nsrNumber,
      approvalStatus:
        (row.punchApproval?.status as
          | 'PENDING'
          | 'APPROVED'
          | 'REJECTED'
          | null
          | undefined) ?? null,
    };
  }

  async updateReceiptMetadata(
    params: UpdateReceiptMetadataParams,
  ): Promise<void> {
    // updateMany + tenant guard silencia no-op se o id não pertencer ao tenant.
    await prisma.timeEntry.updateMany({
      where: { id: params.timeEntryId, tenantId: params.tenantId },
      data: {
        receiptGenerated: true,
        receiptUrl: params.receiptUrl,
        receiptVerifyHash: params.receiptVerifyHash,
      },
    });
  }

  async existsOnDate(
    employeeId: string,
    tenantId: string,
    date: Date,
  ): Promise<boolean> {
    const startOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    const count = await prisma.timeEntry.count({
      where: {
        employeeId,
        tenantId,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
    });
    return count > 0;
  }
}

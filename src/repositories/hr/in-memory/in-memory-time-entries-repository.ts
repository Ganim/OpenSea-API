import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
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

/**
 * Sidecar Phase 06 / Plan 06-02: in-memory tracking of compliance fields
 * (`nsrNumber`, `originNsrNumber`, `adjustmentType`). The domain entity
 * `TimeEntry` does NOT carry these (D-06-01-04: keep entity stable). Tests
 * that need to assert on adjustment metadata read from `complianceMeta`.
 */
type ComplianceMeta = {
  nsrNumber?: number;
  originNsrNumber?: number;
  adjustmentType?: 'ORIGINAL' | 'ADJUSTMENT_APPROVED';
  /** Phase 06 / Plan 06-03 — HMAC do recibo público. */
  receiptVerifyHash?: string;
  receiptUrl?: string;
  receiptGenerated?: boolean;
  /** 'PENDING' quando há PunchApproval vinculado. */
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
};

export class InMemoryTimeEntriesRepository implements TimeEntriesRepository {
  // Public to let specs assert on recorded entries and override fixtures
  // (e.g. prime a fake "already persisted with this requestId" row).
  public items: Array<
    TimeEntry & { requestId?: string; complianceMeta?: ComplianceMeta }
  > = [];
  private nsrCounters: Map<string, number> = new Map();

  async create(data: CreateTimeEntrySchema): Promise<TimeEntry> {
    const id = new UniqueEntityID();
    const timeEntry = TimeEntry.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        employeeId: data.employeeId,
        entryType: data.entryType,
        timestamp: data.timestamp,
        latitude: data.latitude,
        longitude: data.longitude,
        ipAddress: data.ipAddress,
        notes: data.notes,
        metadata: data.metadata ?? null,
      },
      id,
    );
    // Piggyback requestId as a side-property on the in-memory row so
    // findByRequestId can filter without extending the domain entity
    // (the real Prisma row carries the column, but the TimeEntry entity
    // does not — and we do not want to grow the entity just for tests).
    (timeEntry as TimeEntry & { requestId?: string }).requestId =
      data.requestId;

    if (data.nsrNumber != null) {
      const current = this.nsrCounters.get(data.tenantId) ?? 0;
      if (data.nsrNumber > current) {
        this.nsrCounters.set(data.tenantId, data.nsrNumber);
      }
    }

    const enriched = timeEntry as TimeEntry & {
      requestId?: string;
      complianceMeta?: ComplianceMeta;
    };
    if (data.nsrNumber != null) {
      enriched.complianceMeta = {
        nsrNumber: data.nsrNumber,
        adjustmentType: 'ORIGINAL',
      };
    }
    this.items.push(enriched);
    return timeEntry;
  }

  async createWithSequentialNsr(
    data: Omit<CreateTimeEntrySchema, 'nsrNumber'>,
  ): Promise<TimeEntry> {
    const next = (this.nsrCounters.get(data.tenantId) ?? 0) + 1;
    return this.create({ ...data, nsrNumber: next });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry | null> {
    const timeEntry = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return timeEntry || null;
  }

  async findMany(
    filters: FindTimeEntriesFilters,
  ): Promise<FindManyTimeEntriesResult> {
    let result = this.items.filter(
      (item) => item.tenantId.toString() === filters.tenantId,
    );

    if (filters?.employeeId) {
      result = result.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }

    if (filters?.startDate) {
      result = result.filter((item) => item.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      result = result.filter((item) => item.timestamp <= filters.endDate!);
    }

    if (filters?.entryType) {
      result = result.filter((item) =>
        item.entryType.equals(filters.entryType!),
      );
    }

    result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = result.length;
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 50;
    const skip = (page - 1) * perPage;
    const timeEntries = result.slice(skip, skip + perPage);

    return { timeEntries, total };
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<TimeEntry[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId &&
          item.timestamp >= startDate &&
          item.timestamp <= endDate,
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async findLastEntryByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry | null> {
    const entries = this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return entries[0] || null;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(id) &&
        (!tenantId || item.tenantId.toString() === tenantId),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async findMaxNsrNumber(tenantId: string): Promise<number> {
    return this.nsrCounters.get(tenantId) ?? 0;
  }

  async findByRequestId(
    tenantId: string,
    employeeId: string,
    requestId: string,
  ): Promise<TimeEntry | null> {
    const match = this.items.find(
      (entry) =>
        entry.tenantId.toString() === tenantId &&
        entry.employeeId.toString() === employeeId &&
        (entry as TimeEntry & { requestId?: string }).requestId === requestId,
    );
    return match ?? null;
  }

  async createAdjustment(
    params: CreateTimeEntryAdjustmentParams,
  ): Promise<CreateTimeEntryAdjustmentResult> {
    // Locate origin and assert tenant scope.
    const origin = this.items.find(
      (item) =>
        item.id.toString() === params.originEntryId &&
        item.tenantId.toString() === params.tenantId,
    );
    if (!origin) {
      throw new Error(
        `TimeEntry origem não encontrada (id=${params.originEntryId}, tenant=${params.tenantId}).`,
      );
    }
    const originNsr = origin.complianceMeta?.nsrNumber;
    if (originNsr == null) {
      throw new Error(
        `TimeEntry origem ${params.originEntryId} não possui nsrNumber — correção exige NSR válido na origem (Portaria 671).`,
      );
    }

    // Idempotência por requestId (se fornecido).
    if (params.requestId) {
      const existing = this.items.find(
        (item) =>
          item.tenantId.toString() === params.tenantId &&
          (item as TimeEntry & { requestId?: string }).requestId ===
            params.requestId,
      );
      if (existing && existing.complianceMeta?.nsrNumber != null) {
        return {
          timeEntry: existing,
          nsrNumber: existing.complianceMeta.nsrNumber,
          originNsrNumber: originNsr,
        };
      }
    }

    const nextNsr = (this.nsrCounters.get(params.tenantId) ?? 0) + 1;
    this.nsrCounters.set(params.tenantId, nextNsr);

    const adjustmentId = new UniqueEntityID();
    const adjustment = TimeEntry.create(
      {
        tenantId: new UniqueEntityID(params.tenantId),
        employeeId: params.employeeId,
        entryType: params.entryType,
        timestamp: params.timestamp,
        notes: params.note,
        metadata: { resolverUserId: params.resolverUserId },
      },
      adjustmentId,
    );
    const enriched = adjustment as TimeEntry & {
      requestId?: string;
      complianceMeta?: ComplianceMeta;
    };
    enriched.requestId = params.requestId;
    enriched.complianceMeta = {
      nsrNumber: nextNsr,
      originNsrNumber: originNsr,
      adjustmentType: 'ADJUSTMENT_APPROVED',
    };
    this.items.push(enriched);

    return {
      timeEntry: adjustment,
      nsrNumber: nextNsr,
      originNsrNumber: originNsr,
    };
  }

  async findByReceiptVerifyHash(
    nsrHash: string,
  ): Promise<TimeEntryForReceiptLookup | null> {
    const row = this.items.find(
      (item) => item.complianceMeta?.receiptVerifyHash === nsrHash,
    );
    if (!row) return null;
    const nsrNumber = row.complianceMeta?.nsrNumber;
    if (nsrNumber == null) return null;

    const entryTypeValue = row.entryType.value as
      | 'CLOCK_IN'
      | 'CLOCK_OUT'
      | 'BREAK_START'
      | 'BREAK_END'
      | 'OVERTIME_START'
      | 'OVERTIME_END';
    const allowed: TimeEntryForReceiptLookup['entryType'][] = [
      'CLOCK_IN',
      'CLOCK_OUT',
      'BREAK_START',
      'BREAK_END',
    ];
    if (
      !allowed.includes(
        entryTypeValue as TimeEntryForReceiptLookup['entryType'],
      )
    ) {
      return null;
    }

    return {
      id: row.id.toString(),
      tenantId: row.tenantId.toString(),
      employeeId: row.employeeId.toString(),
      entryType: entryTypeValue as TimeEntryForReceiptLookup['entryType'],
      timestamp: row.timestamp,
      nsrNumber,
      approvalStatus: row.complianceMeta?.approvalStatus ?? null,
    };
  }

  async updateReceiptMetadata(
    params: UpdateReceiptMetadataParams,
  ): Promise<void> {
    const row = this.items.find(
      (item) =>
        item.id.toString() === params.timeEntryId &&
        item.tenantId.toString() === params.tenantId,
    );
    if (!row) return;
    row.complianceMeta = {
      ...(row.complianceMeta ?? {}),
      receiptGenerated: true,
      receiptUrl: params.receiptUrl,
      receiptVerifyHash: params.receiptVerifyHash,
    };
  }
}

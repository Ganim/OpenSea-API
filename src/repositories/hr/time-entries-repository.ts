import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TimeEntry } from '@/entities/hr/time-entry';
import type { TimeEntryType } from '@/entities/hr/value-objects';

export interface CreateTimeEntrySchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  entryType: TimeEntryType;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
  nsrNumber?: number;
  /**
   * Idempotency key scoped by (tenantId, employeeId, requestId).
   * Added in Plan 04-04 (D-11). When set, the DB-level composite unique
   * constraint `time_entries_idempotency_unique` ensures a retried
   * request with the same triple resolves to the existing row rather
   * than a duplicate punch.
   */
  requestId?: string;
  /**
   * Opaque audit payload (D-04 / Plan 05-07). Currently carries liveness
   * metadata emitted by the kiosk. Persisted as-is; never queried back
   * in Phase 5.
   */
  metadata?: Record<string, unknown> | null;
}

export interface FindTimeEntriesFilters {
  tenantId: string;
  employeeId?: UniqueEntityID;
  startDate?: Date;
  endDate?: Date;
  entryType?: TimeEntryType;
  page?: number;
  perPage?: number;
}

export interface FindManyTimeEntriesResult {
  timeEntries: TimeEntry[];
  total: number;
}

export interface TimeEntriesRepository {
  create(data: CreateTimeEntrySchema): Promise<TimeEntry>;
  /**
   * Creates a TimeEntry with a sequential NSR number, retrying on unique
   * constraint violation (@@unique([tenantId, nsrNumber])) to handle
   * concurrent punches safely. Required by Portaria 671 Anexo III — NSR
   * duplicates invalidate the AFD.
   */
  createWithSequentialNsr(
    data: Omit<CreateTimeEntrySchema, 'nsrNumber'>,
  ): Promise<TimeEntry>;
  findById(id: UniqueEntityID, tenantId: string): Promise<TimeEntry | null>;
  findMany(filters: FindTimeEntriesFilters): Promise<FindManyTimeEntriesResult>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry[]>;
  findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<TimeEntry[]>;
  findLastEntryByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry | null>;
  /**
   * Idempotency lookup added in Plan 04-04 (D-11 / Pitfall 3). Must use
   * `findFirst` (NOT findUnique) because `requestId` is nullable —
   * findUnique would mistreat the (tenantId, employeeId, null) triple
   * as a match when no request_id is set on historical rows.
   *
   * Returns null when no prior batida carries this requestId, allowing
   * the use case to proceed with a fresh insert.
   */
  findByRequestId(
    tenantId: string,
    employeeId: string,
    requestId: string,
  ): Promise<TimeEntry | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
  findMaxNsrNumber(tenantId: string): Promise<number>;
}

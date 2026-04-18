import { randomUUID } from 'node:crypto';

import { Prisma } from '@prisma/generated/client.js';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchApproval } from '@/entities/hr/punch-approval';
import type { TimeEntry } from '@/entities/hr/time-entry';
import { TimeEntryType } from '@/entities/hr/value-objects';
import { getTypedEventBus } from '@/lib/events';
import { prisma } from '@/lib/prisma';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PunchApprovalsRepository } from '@/repositories/hr/punch-approvals-repository';
import type { PunchConfigRepository } from '@/repositories/hr/punch-config-repository';
import type { PunchDevicesRepository } from '@/repositories/hr/punch-devices-repository';
import type { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';

import type { PunchValidationPipeline } from './validators/pipeline';

/**
 * Temporary event-name constants. Plan 04-05 introduces a typed
 * `PUNCH_EVENTS` namespace alongside the other module-scoped event
 * constants in `src/lib/events`; this file will then import from there.
 *
 * Kept deliberately local for now to avoid cross-plan coupling —
 * downstream consumers in Plan 5 can grep the literal to find us.
 */
const EVT_TIME_ENTRY_CREATED = 'punch.time-entry.created';
const EVT_APPROVAL_REQUESTED = 'punch.approval.requested';

export interface ExecutePunchRequest {
  tenantId: string;
  /** Populated on the JWT path (user's own punch). */
  invokingUserId?: string;
  /** Populated on the device-token path (kiosk/PWA/biometric reader). */
  punchDeviceId?: string;
  /** Required on the device-token path; derived via JWT on the user path. */
  employeeId?: string;
  entryType?: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
  timestamp?: Date;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
  /**
   * Idempotency key — the client passes this on retries. Scoped by
   * `(tenantId, employeeId, requestId)` at the DB level (D-11).
   */
  requestId?: string;
}

export interface ExecutePunchApprovalCreated {
  id: string;
  reason: string;
  details: Record<string, unknown>;
}

export interface ExecutePunchResponse {
  timeEntry: TimeEntry;
  nsrNumber: number;
  approvalsCreated: ExecutePunchApprovalCreated[];
  /**
   * True when the request was idempotent — either because `findByRequestId`
   * returned an existing row up-front, or because the composite unique
   * constraint raised P2002 and we recovered the prior row.
   */
  idempotentHit: boolean;
}

/**
 * Canonical punch execution use case (D-03 → D-12).
 *
 * Orchestrates the unified punch endpoint:
 *   1. Resolve `employeeId` from JWT or validate against device allowlist
 *   2. Idempotency short-circuit by `requestId`
 *   3. Load PunchConfig + PunchDevice (for geofence context)
 *   4. Infer or validate `entryType` (last entry of the day heuristic)
 *   5. Run `PunchValidationPipeline` (5 validators, D-05)
 *   6. Persist TimeEntry (+ PunchApprovals) atomically (D-12)
 *   7. Emit typed events AFTER the transaction commits (Pitfall 2)
 *
 * Legacy `ClockInUseCase`/`ClockOutUseCase` stay around marked
 * `@deprecated` until the kiosk/PWA UI fully migrates (see Task 5).
 */
export class ExecutePunchUseCase {
  constructor(
    private readonly timeEntriesRepo: TimeEntriesRepository,
    private readonly employeesRepo: EmployeesRepository,
    private readonly punchDevicesRepo: PunchDevicesRepository,
    private readonly punchApprovalsRepo: PunchApprovalsRepository,
    private readonly punchConfigRepo: PunchConfigRepository,
    private readonly pipeline: PunchValidationPipeline,
  ) {}

  async execute(req: ExecutePunchRequest): Promise<ExecutePunchResponse> {
    const timestamp = req.timestamp ?? new Date();

    // 1. Resolve employeeId (Pitfall 4).
    const resolvedEmployeeId = await this.resolveEmployeeId(req);

    // 2. Idempotency shortcut — if a prior request with this requestId
    //    already landed, return it without writing anything.
    if (req.requestId) {
      const existing = await this.timeEntriesRepo.findByRequestId(
        req.tenantId,
        resolvedEmployeeId,
        req.requestId,
      );
      if (existing) {
        return {
          timeEntry: existing,
          nsrNumber: 0, // entity does not carry nsrNumber; use 0 for idempotent replays
          approvalsCreated: [],
          idempotentHit: true,
        };
      }
    }

    // 3. Device + geofence context.
    const punchDevice = req.punchDeviceId
      ? await this.punchDevicesRepo.findById(
          new UniqueEntityID(req.punchDeviceId),
          req.tenantId,
        )
      : null;

    // 4. Infer or validate entryType (D-04).
    const finalType =
      req.entryType ??
      (await this.inferEntryType(req.tenantId, resolvedEmployeeId));

    // 5. Pipeline.
    const punchConfig = await this.punchConfigRepo.findByTenantId(req.tenantId);
    const pipelineResult = await this.pipeline.run({
      tenantId: req.tenantId,
      employeeId: resolvedEmployeeId,
      timestamp,
      latitude: req.latitude,
      longitude: req.longitude,
      punchDevice: punchDevice
        ? {
            id: punchDevice.id.toString(),
            geofenceZoneId: punchDevice.geofenceZoneId?.toString() ?? null,
          }
        : undefined,
      punchConfig: { geofenceEnabled: punchConfig?.geofenceEnabled ?? false },
    });
    if (pipelineResult.decision === 'REJECT') {
      throw new BadRequestError(pipelineResult.rejection.reason);
    }
    const approvalsToCreate =
      pipelineResult.decision === 'ACCEPT_WITH_APPROVALS'
        ? pipelineResult.approvals
        : [];

    // 6. Persist TimeEntry + PunchApprovals (transactional write, Pitfall 2).
    const { timeEntry, approvalsCreated, idempotentHit } =
      await this.writeAtomically(
        req,
        resolvedEmployeeId,
        finalType,
        timestamp,
        approvalsToCreate,
      );

    // 7. Emit events AFTER commit (Pitfall 2 — never emit from inside
    //    the transaction or a rollback will leak a phantom event).
    if (!idempotentHit) {
      const bus = getTypedEventBus();
      await bus.publish({
        id: randomUUID(),
        type: EVT_TIME_ENTRY_CREATED,
        version: 1,
        tenantId: req.tenantId,
        source: 'hr',
        sourceEntityType: 'time_entry',
        sourceEntityId: timeEntry.id.toString(),
        data: {
          timeEntryId: timeEntry.id.toString(),
          employeeId: resolvedEmployeeId,
          entryType: finalType,
          timestamp: timestamp.toISOString(),
          hasApproval: approvalsCreated.length > 0,
          punchDeviceId: req.punchDeviceId ?? null,
        },
        metadata: req.invokingUserId
          ? { userId: req.invokingUserId }
          : undefined,
        timestamp: new Date().toISOString(),
      });
      for (const a of approvalsCreated) {
        await bus.publish({
          id: randomUUID(),
          type: EVT_APPROVAL_REQUESTED,
          version: 1,
          tenantId: req.tenantId,
          source: 'hr',
          sourceEntityType: 'punch_approval',
          sourceEntityId: a.id,
          data: {
            approvalId: a.id,
            timeEntryId: timeEntry.id.toString(),
            employeeId: resolvedEmployeeId,
            reason: a.reason,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      timeEntry,
      nsrNumber: 0, // entity does not expose nsrNumber publicly
      approvalsCreated,
      idempotentHit,
    };
  }

  /**
   * Authorization-aware employeeId resolution.
   *
   * - JWT path: look up the employee tied to the JWT's userId. Reject if
   *   `body.employeeId` contradicts the derived one (prevents a user
   *   from punching for someone else by smuggling an id into the body).
   * - Device-token path: `body.employeeId` is required; enforce the
   *   device allowlist (direct employee link or department link).
   *   Default-allow when the device has zero allowlist rows — migration
   *   path for devices provisioned before allowlist UI exists.
   */
  private async resolveEmployeeId(req: ExecutePunchRequest): Promise<string> {
    if (req.invokingUserId) {
      const emp = await this.employeesRepo.findByUserId(
        new UniqueEntityID(req.invokingUserId),
        req.tenantId,
      );
      if (!emp) {
        throw new ResourceNotFoundError(
          'Funcionário vinculado ao usuário não encontrado',
        );
      }
      const derived = emp.id.toString();
      if (req.employeeId && req.employeeId !== derived) {
        throw new UnauthorizedError(
          'employeeId divergente do JWT não permitido',
        );
      }
      return derived;
    }

    if (req.punchDeviceId) {
      if (!req.employeeId) {
        throw new BadRequestError(
          'employeeId é obrigatório quando autenticado por dispositivo',
        );
      }
      const isAllowed = await this.isEmployeeOnDeviceAllowlist(
        req.punchDeviceId,
        req.employeeId,
        req.tenantId,
      );
      if (!isAllowed) {
        throw new UnauthorizedError(
          'Funcionário não autorizado neste dispositivo',
        );
      }
      return req.employeeId;
    }

    throw new UnauthorizedError('Autenticação ausente');
  }

  /**
   * Direct or department-based allowlist check. When the device has no
   * allowlist at all (neither direct nor departmental), we default-allow
   * — a migration convenience so a freshly-paired device isn't rendered
   * useless pending allowlist UI.
   */
  private async isEmployeeOnDeviceAllowlist(
    deviceId: string,
    employeeId: string,
    tenantId: string,
  ): Promise<boolean> {
    const directMatch = await prisma.punchDeviceEmployee.findUnique({
      where: { deviceId_employeeId: { deviceId, employeeId } },
    });
    if (directMatch) return true;

    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { departmentId: true },
    });
    if (emp?.departmentId) {
      const deptMatch = await prisma.punchDeviceDepartment.findUnique({
        where: {
          deviceId_departmentId: {
            deviceId,
            departmentId: emp.departmentId,
          },
        },
      });
      if (deptMatch) return true;
    }

    // Default-allow when the device has zero allowlist rows at all.
    const directCount = await prisma.punchDeviceEmployee.count({
      where: { deviceId },
    });
    const deptCount = await prisma.punchDeviceDepartment.count({
      where: { deviceId },
    });
    return directCount + deptCount === 0;
  }

  /**
   * Server-side entryType inference (D-04).
   *
   * - No last entry ever → CLOCK_IN (new employee, first punch).
   * - Last entry is CLOCK_OUT → AlreadyClockedOutError (day is finished;
   *   extra batidas in the same day require manager correction).
   * - Otherwise → CLOCK_OUT (covers CLOCK_IN → OUT and BREAK_* → OUT).
   *
   * BREAK_START/BREAK_END inference is deferred to a future plan when
   * the UI exposes explicit break buttons — v1 delegates that decision
   * to the client (which may pass `entryType` explicitly).
   */
  private async inferEntryType(
    tenantId: string,
    employeeId: string,
  ): Promise<'CLOCK_IN' | 'CLOCK_OUT'> {
    const last = await this.timeEntriesRepo.findLastEntryByEmployee(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!last) return 'CLOCK_IN';
    if (last.entryType.isClockOut()) {
      throw new BadRequestError(
        'Funcionário já finalizou o expediente; nova batida no mesmo dia requer correção do gestor',
      );
    }
    return 'CLOCK_OUT';
  }

  /**
   * Atomic write: TimeEntry + optional PunchApprovals. The NSR allocator
   * already handles concurrent races internally; we wrap the pair in a
   * single `$transaction` so a mid-flight crash cannot leave an orphan
   * approval without its batida (or vice versa).
   *
   * P2002 on the idempotency composite unique is treated as a benign
   * race: another instance of the same request won the insert; we fetch
   * and return the winner's row marked idempotentHit.
   */
  private async writeAtomically(
    req: ExecutePunchRequest,
    employeeId: string,
    entryType: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END',
    timestamp: Date,
    approvalsToCreate: Array<{
      approvalReason: 'OUT_OF_GEOFENCE';
      reason: string;
      details: Record<string, unknown>;
    }>,
  ): Promise<{
    timeEntry: TimeEntry;
    approvalsCreated: ExecutePunchApprovalCreated[];
    idempotentHit: boolean;
  }> {
    try {
      return await prisma.$transaction(async () => {
        const te = await this.timeEntriesRepo.createWithSequentialNsr({
          tenantId: req.tenantId,
          employeeId: new UniqueEntityID(employeeId),
          entryType: TimeEntryType.create(entryType),
          timestamp,
          latitude: req.latitude,
          longitude: req.longitude,
          ipAddress: req.ipAddress,
          notes: req.notes,
          requestId: req.requestId,
        });

        const approvalsCreated: ExecutePunchApprovalCreated[] = [];
        for (const a of approvalsToCreate) {
          const approval = PunchApproval.create({
            id: new UniqueEntityID(),
            tenantId: new UniqueEntityID(req.tenantId),
            timeEntryId: te.id,
            employeeId: new UniqueEntityID(employeeId),
            reason: a.approvalReason,
            details: a.details,
          });
          await this.punchApprovalsRepo.create(approval);
          approvalsCreated.push({
            id: approval.id.toString(),
            reason: a.approvalReason,
            details: a.details,
          });
        }

        return { timeEntry: te, approvalsCreated, idempotentHit: false };
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const target = err.meta?.target;
        const targetStr = Array.isArray(target)
          ? target.join(',')
          : String(target ?? '');
        const looksLikeIdempotencyCollision =
          targetStr.includes('time_entries_idempotency_unique') ||
          targetStr.includes('request_id');
        if (looksLikeIdempotencyCollision && req.requestId) {
          const existing = await this.timeEntriesRepo.findByRequestId(
            req.tenantId,
            employeeId,
            req.requestId,
          );
          if (existing) {
            return {
              timeEntry: existing,
              approvalsCreated: [],
              idempotentHit: true,
            };
          }
        }
      }
      throw err;
    }
  }
}

import { createHash, randomUUID } from 'node:crypto';

import { Prisma } from '@prisma/generated/client.js';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InvalidQRTokenError } from '@/@errors/use-cases/invalid-qr-token-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchApproval } from '@/entities/hr/punch-approval';
import type { TimeEntry } from '@/entities/hr/time-entry';
import { TimeEntryType } from '@/entities/hr/value-objects';
import { getTypedEventBus } from '@/lib/events';
import { PUNCH_EVENTS } from '@/lib/events/punch-events';
import type {
  PunchApprovalRequestedData,
  PunchTimeEntryCreatedData,
} from '@/lib/events/punch-events';
import { prisma } from '@/lib/prisma';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PunchApprovalsRepository } from '@/repositories/hr/punch-approvals-repository';
import type { PunchConfigRepository } from '@/repositories/hr/punch-config-repository';
import type { PunchDevicesRepository } from '@/repositories/hr/punch-devices-repository';
import type { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';
import type { VerifyPunchPinUseCase } from '@/use-cases/hr/punch-pin/verify-punch-pin';

import type { PunchLivenessMetadata } from './validators/punch-validator.interface';
import type { PunchValidationPipeline } from './validators/pipeline';

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

  // ─── Phase 5 kiosk additions (Plan 05-07) ──────────────────────────────
  /**
   * QR token scanned from the employee's crachá (D-15). 32-byte hex string.
   * `resolveEmployeeId` hashes it with SHA-256 and calls
   * `employeesRepo.findByQrTokenHash` to hydrate the funcionário.
   */
  qrToken?: string;
  /** PIN fallback: the 6-digit PIN typed on the kiosk (D-08). */
  pin?: string;
  /** PIN fallback: the employee's matricula (used with `pin`) (D-08). */
  matricula?: string;
  /**
   * 128-d face embedding extracted by the kiosk (`face-api.js`) and
   * forwarded to the server for match. Absent on JWT / PWA paths. D-10
   * requires it on every kiosk path (QR or PIN) — the validator enforces
   * via `FaceEnrollmentRequiredError` when the employee has no enrollment.
   */
  faceEmbedding?: number[];
  /** Kiosk-side liveness signals (D-04). Persisted to TimeEntry.metadata. */
  liveness?: PunchLivenessMetadata;
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
    /**
     * Phase 5 (Plan 05-07): internal PIN verification use case, called from
     * the kiosk pin+matricula branch. Optional — legacy call sites from
     * Phase 4 that only use JWT / device-token paths can leave it unset
     * and no PIN resolution will ever execute.
     */
    private readonly verifyPunchPinUseCase?: VerifyPunchPinUseCase,
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
      punchConfig: {
        geofenceEnabled: punchConfig?.geofenceEnabled ?? false,
        faceMatchThreshold: punchConfig?.faceMatchThreshold,
      },
      // Phase 5 (Plan 05-07): kiosk-only signals — consumed by FaceMatchValidator.
      faceEmbedding: req.faceEmbedding,
      liveness: req.liveness,
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
      const timeEntryCreatedData: PunchTimeEntryCreatedData = {
        timeEntryId: timeEntry.id.toString(),
        employeeId: resolvedEmployeeId,
        entryType: finalType,
        timestamp: timestamp.toISOString(),
        nsrNumber: null,
        hasApproval: approvalsCreated.length > 0,
        punchDeviceId: req.punchDeviceId ?? null,
      };
      await bus.publish({
        id: randomUUID(),
        type: PUNCH_EVENTS.TIME_ENTRY_CREATED,
        version: 1,
        tenantId: req.tenantId,
        source: 'hr',
        sourceEntityType: 'time_entry',
        sourceEntityId: timeEntry.id.toString(),
        data: timeEntryCreatedData as unknown as Record<string, unknown>,
        metadata: req.invokingUserId
          ? { userId: req.invokingUserId }
          : undefined,
        timestamp: new Date().toISOString(),
      });
      for (const a of approvalsCreated) {
        const approvalRequestedData: PunchApprovalRequestedData = {
          approvalId: a.id,
          timeEntryId: timeEntry.id.toString(),
          employeeId: resolvedEmployeeId,
          reason: a.reason as 'OUT_OF_GEOFENCE' | 'FACE_MATCH_LOW',
          details: a.details,
        };
        await bus.publish({
          id: randomUUID(),
          type: PUNCH_EVENTS.APPROVAL_REQUESTED,
          version: 1,
          tenantId: req.tenantId,
          source: 'hr',
          sourceEntityType: 'punch_approval',
          sourceEntityId: a.id,
          data: approvalRequestedData as unknown as Record<string, unknown>,
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
   * Branch precedence (Phase 5 / Plan 05-07):
   *  1. QR token      — `qrToken` → sha256(token) → `findByQrTokenHash`.
   *  2. PIN+matricula — `matricula` → `findByRegistrationNumber` +
   *                     `verifyPunchPinUseCase` verifies the PIN.
   *  3. JWT path (pre-existing): `invokingUserId` → `findByUserId`.
   *  4. Device-token path (pre-existing): `employeeId` + allowlist.
   *
   * The kiosk auth branches (1 and 2) run FIRST because:
   *   - They are cheaper (single indexed lookup for QR, one lookup + bcrypt
   *     compare for PIN) than JWT derivation.
   *   - They are the Phase 5 happy path; pushing them below the JWT branch
   *     would waste a DB roundtrip for every kiosk batida.
   *
   * D-10 invariant: these branches identify the funcionário but DO NOT
   * grant a batida. The downstream FaceMatchValidator still runs and
   * throws FaceEnrollmentRequiredError when no enrollment exists —
   * preserving the two-factor contract (PIN alone or QR alone never
   * produce a punch).
   */
  private async resolveEmployeeId(req: ExecutePunchRequest): Promise<string> {
    // Phase 5 (1) — QR token branch.
    if (req.qrToken) {
      const hash = createHash('sha256').update(req.qrToken).digest('hex');
      const emp = await this.employeesRepo.findByQrTokenHash(
        hash,
        req.tenantId,
      );
      if (!emp) throw new InvalidQRTokenError();
      return emp.id.toString();
    }

    // Phase 5 (2) — PIN + matricula branch.
    if (req.pin && req.matricula) {
      const emp = await this.employeesRepo.findByRegistrationNumber(
        req.matricula,
        req.tenantId,
      );
      // Intentional copy reuse: when matricula is unknown we raise
      // InvalidQRTokenError (same UI copy: "Crachá não reconhecido") so
      // the kiosk cannot be used to enumerate valid matriculas by diffing
      // error messages. Internal error class stays distinct for logs.
      if (!emp) {
        throw new InvalidQRTokenError(
          'Crachá não reconhecido. Verifique a matrícula.',
        );
      }
      if (!this.verifyPunchPinUseCase) {
        // Defensive: a PIN path was taken but the factory did not wire
        // the use case. This is a configuration bug — fail-closed.
        throw new BadRequestError(
          'Verificação de PIN não está configurada neste servidor.',
        );
      }
      // verifyPunchPinUseCase may throw PinInvalidError, PinLockedError,
      // or ResourceNotFoundError — all propagate to the controller.
      await this.verifyPunchPinUseCase.execute({
        tenantId: req.tenantId,
        employeeId: emp.id.toString(),
        pin: req.pin,
      });
      return emp.id.toString();
    }

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
      approvalReason: 'OUT_OF_GEOFENCE' | 'FACE_MATCH_LOW';
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
        // Phase 5 (Plan 05-07 / D-04): persist liveness as-is under
        // `metadata.liveness` for future antifraude analysis. Only
        // stamped when the kiosk actually carried the payload; JWT /
        // PWA paths leave it null.
        const metadata = req.liveness
          ? { liveness: req.liveness as Record<string, unknown> }
          : null;

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
          metadata,
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

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks MUST come before any import of the module-under-test.
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      // $transaction simply runs the callback inline — unit tests do not
      // need real transactional semantics; the repo's createWithSequentialNsr
      // is the one that matters, and it already lives on the in-memory repo.
      $transaction: vi.fn(async (cb: () => Promise<unknown>) => cb()),
      punchDeviceEmployee: {
        findUnique: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      punchDeviceDepartment: {
        findUnique: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      employee: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  };
});

vi.mock('@/lib/events', () => {
  // Bus stub: publish() is a no-op awaitable spy; getTypedEventBus returns
  // the same stub across calls so specs can assert call counts.
  const bus = { publish: vi.fn().mockResolvedValue(undefined) };
  return {
    getTypedEventBus: () => bus,
    __bus: bus, // exposed for assertions
  };
});

import bcrypt from 'bcryptjs';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { FaceEnrollment } from '@/entities/hr/face-enrollment';
import { PunchApproval } from '@/entities/hr/punch-approval';
import { PunchDevice } from '@/entities/hr/punch-device';
import { TimeEntry } from '@/entities/hr/time-entry';
import {
  CPF,
  ContractType,
  EmployeeStatus,
  TimeEntryType,
  WorkRegime,
} from '@/entities/hr/value-objects';
import * as eventsModule from '@/lib/events';
import { encryptEmbedding } from '@/lib/face-encryption';
import { prisma } from '@/lib/prisma';
import type { AbsencesRepository } from '@/repositories/hr/absences-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { GeofenceZonesRepository } from '@/repositories/hr/geofence-zones-repository';
import { InMemoryFaceEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-face-enrollments-repository';
import { InMemoryPunchApprovalsRepository } from '@/repositories/hr/in-memory/in-memory-punch-approvals-repository';
import { InMemoryPunchConfigRepository } from '@/repositories/hr/in-memory/in-memory-punch-config-repository';
import { InMemoryPunchDevicesRepository } from '@/repositories/hr/in-memory/in-memory-punch-devices-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';
import type { PunchConfigRepository } from '@/repositories/hr/punch-config-repository';
import type { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';
import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';
import { VerifyPunchPinUseCase } from '@/use-cases/hr/punch-pin/verify-punch-pin';

import { ExecutePunchUseCase } from './execute-punch';
import { AbsenceActiveValidator } from './validators/absence-active.validator';
import { EmployeeActiveValidator } from './validators/employee-active.validator';
import { FaceMatchValidator } from './validators/face-match.validator';
import { GeofenceValidator } from './validators/geofence.validator';
import { PunchValidationPipeline } from './validators/pipeline';
import { VacationActiveValidator } from './validators/vacation-active.validator';
import { WorkScheduleValidator } from './validators/work-schedule.validator';

const TENANT_ID = 'tenant-1';

beforeAll(() => {
  // Lazy-init target for the face-encryption helper; the spec seeds 128-d
  // cadastral vectors so downstream validators can decrypt them without a
  // real env.
  if (!process.env.FACE_ENROLLMENT_ENCRYPTION_KEY) {
    process.env.FACE_ENROLLMENT_ENCRYPTION_KEY = Buffer.from(
      '0123456789abcdef0123456789abcdef',
    ).toString('base64');
  }
});

function makeEmployee({
  id = new UniqueEntityID('emp-1'),
  userId,
  registrationNumber = '0001',
  status = EmployeeStatus.create('ACTIVE'),
  qrTokenHash,
  punchPinHash,
}: {
  id?: UniqueEntityID;
  userId?: UniqueEntityID;
  registrationNumber?: string;
  status?: EmployeeStatus;
  qrTokenHash?: string;
  punchPinHash?: string;
} = {}): Employee {
  return Employee.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      registrationNumber,
      userId,
      fullName: 'Test Employee',
      pcd: false,
      cpf: CPF.create('39053344705'),
      country: 'BR',
      hireDate: new Date('2024-01-01'),
      status,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 40,
      isPregnant: false,
      metadata: {},
      pendingIssues: [],
      qrTokenHash,
      punchPinHash,
    },
    id,
  );
}

function makeEmployeesRepoStub(
  overrides: {
    byId?: Employee | null;
    byUserId?: Employee | null;
    byQrTokenHash?: Employee | null;
    byRegistration?: Employee | null;
    onUpdatePinLockState?: ReturnType<typeof vi.fn>;
    onClearPinLock?: ReturnType<typeof vi.fn>;
  } = {},
): EmployeesRepository {
  return {
    findById: vi.fn().mockResolvedValue(overrides.byId ?? null),
    findByUserId: vi.fn().mockResolvedValue(overrides.byUserId ?? null),
    findByQrTokenHash: vi
      .fn()
      .mockResolvedValue(overrides.byQrTokenHash ?? null),
    findByRegistrationNumber: vi
      .fn()
      .mockResolvedValue(overrides.byRegistration ?? null),
    updatePinLockState:
      overrides.onUpdatePinLockState ?? vi.fn().mockResolvedValue(undefined),
    clearPinLock:
      overrides.onClearPinLock ?? vi.fn().mockResolvedValue(undefined),
    updatePunchPin: vi.fn().mockResolvedValue(undefined),
  } as unknown as EmployeesRepository;
}

function noVacations(): VacationPeriodsRepository {
  return {
    findManyByEmployeeAndStatus: vi.fn().mockResolvedValue([]),
  } as unknown as VacationPeriodsRepository;
}

function noAbsences(): AbsencesRepository {
  return {
    findOverlapping: vi.fn().mockResolvedValue([]),
  } as unknown as AbsencesRepository;
}

function withActiveShift(): ShiftAssignmentsRepository {
  return {
    findActiveByEmployee: vi.fn().mockResolvedValue({ id: 'assignment-1' }),
  } as unknown as ShiftAssignmentsRepository;
}

function withoutShift(): ShiftAssignmentsRepository {
  return {
    findActiveByEmployee: vi.fn().mockResolvedValue(null),
  } as unknown as ShiftAssignmentsRepository;
}

function noGeofence(): GeofenceZonesRepository {
  return { findById: vi.fn() } as unknown as GeofenceZonesRepository;
}

function punchConfig(enabled: boolean): PunchConfigRepository {
  return {
    findByTenantId: vi
      .fn()
      .mockResolvedValue({ geofenceEnabled: enabled } as unknown),
  } as unknown as PunchConfigRepository;
}

function buildUseCase(
  overrides: {
    timeEntries?: InMemoryTimeEntriesRepository;
    employees?: EmployeesRepository;
    vacations?: VacationPeriodsRepository;
    absences?: AbsencesRepository;
    shifts?: ShiftAssignmentsRepository;
    geofence?: GeofenceZonesRepository;
    punchConfig?: PunchConfigRepository;
    devices?: InMemoryPunchDevicesRepository;
    approvals?: InMemoryPunchApprovalsRepository;
    // Phase 5 (Plan 05-07) additions — default to wired, so every existing
    // Phase 4 test continues to work (faceEmbedding is optional and
    // short-circuits to ACCEPT when not provided).
    faceEnrollments?: InMemoryFaceEnrollmentsRepository;
    punchConfigInMemory?: InMemoryPunchConfigRepository;
  } = {},
) {
  const timeEntries =
    overrides.timeEntries ?? new InMemoryTimeEntriesRepository();
  const employees = overrides.employees ?? makeEmployeesRepoStub({});
  const vacations = overrides.vacations ?? noVacations();
  const absences = overrides.absences ?? noAbsences();
  const shifts = overrides.shifts ?? withActiveShift();
  const geofence = overrides.geofence ?? noGeofence();
  const configRepo = overrides.punchConfig ?? punchConfig(false);
  const devices = overrides.devices ?? new InMemoryPunchDevicesRepository();
  const approvals =
    overrides.approvals ?? new InMemoryPunchApprovalsRepository();
  const faceEnrollments =
    overrides.faceEnrollments ?? new InMemoryFaceEnrollmentsRepository();
  // FaceMatchValidator reads the tenant config via its own repo handle. We
  // inject an in-memory config repo that returns the same geofenceEnabled
  // flag as the outer `configRepo` so specs can control both channels
  // with a single seed. Defaults to an empty repo (threshold falls back).
  const faceConfigRepo =
    overrides.punchConfigInMemory ?? new InMemoryPunchConfigRepository();

  const pipeline = new PunchValidationPipeline([
    new EmployeeActiveValidator(employees),
    new VacationActiveValidator(vacations),
    new AbsenceActiveValidator(absences),
    new WorkScheduleValidator(shifts),
    new GeofenceValidator(geofence),
    new FaceMatchValidator(faceEnrollments, faceConfigRepo),
  ]);

  const verifyPunchPinUseCase = new VerifyPunchPinUseCase(employees);

  const useCase = new ExecutePunchUseCase(
    timeEntries,
    employees,
    devices,
    approvals,
    configRepo,
    pipeline,
    verifyPunchPinUseCase,
  );

  return {
    useCase,
    timeEntries,
    employees,
    devices,
    approvals,
    faceEnrollments,
    faceConfigRepo,
  };
}

describe('ExecutePunchUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default behavior of the event bus mock.
    const bus = (
      eventsModule as unknown as {
        __bus: { publish: ReturnType<typeof vi.fn> };
      }
    ).__bus;
    bus.publish.mockResolvedValue(undefined);
    // Default: device allowlist is empty (default-allow).
    (
      prisma.punchDeviceEmployee.count as ReturnType<typeof vi.fn>
    ).mockResolvedValue(0);
    (
      prisma.punchDeviceDepartment.count as ReturnType<typeof vi.fn>
    ).mockResolvedValue(0);
  });

  it('JWT path: resolves employeeId via findByUserId and creates a CLOCK_IN when no prior entry exists', async () => {
    const employee = makeEmployee({ userId: new UniqueEntityID('user-1') });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });

    const { useCase, timeEntries } = buildUseCase({ employees });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      invokingUserId: 'user-1',
    });

    expect(result.idempotentHit).toBe(false);
    expect(result.approvalsCreated).toEqual([]);
    expect(result.timeEntry.entryType.value).toBe('CLOCK_IN');
    expect(timeEntries.items).toHaveLength(1);
  });

  it('JWT path: infers CLOCK_OUT when last entry is CLOCK_IN', async () => {
    const employee = makeEmployee({ userId: new UniqueEntityID('user-1') });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });
    const timeEntries = new InMemoryTimeEntriesRepository();
    await timeEntries.create({
      tenantId: TENANT_ID,
      employeeId: employee.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2026-04-18T08:00:00Z'),
      nsrNumber: 1,
    });

    const { useCase } = buildUseCase({ employees, timeEntries });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      invokingUserId: 'user-1',
    });

    expect(result.timeEntry.entryType.value).toBe('CLOCK_OUT');
  });

  it('REJECTs with BadRequestError when pipeline rejects (employee inactive)', async () => {
    const employee = makeEmployee({
      userId: new UniqueEntityID('user-1'),
      status: EmployeeStatus.create('TERMINATED'),
    });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });

    const { useCase } = buildUseCase({ employees });

    await expect(
      useCase.execute({ tenantId: TENANT_ID, invokingUserId: 'user-1' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('ACCEPT_WITH_APPROVALS: persists TimeEntry AND PunchApproval row when outside geofence', async () => {
    const employee = makeEmployee({ userId: new UniqueEntityID('user-1') });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });
    // Geofence repo returns a zone — but pipeline needs punchDevice with zoneId
    // plus config.geofenceEnabled. We feed those via the device path.
    const devices = new InMemoryPunchDevicesRepository();
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Kiosk 1',
      deviceKind: 'KIOSK_PUBLIC',
      geofenceZoneId: new UniqueEntityID('zone-1'),
    });
    devices.items.push(device);
    const geofence: GeofenceZonesRepository = {
      findById: vi.fn().mockResolvedValue({
        id: { toString: () => 'zone-1' },
        latitude: 0,
        longitude: 0,
        radiusMeters: 100,
        isActive: true,
      }),
    } as unknown as GeofenceZonesRepository;

    const { useCase, approvals, timeEntries } = buildUseCase({
      employees,
      devices,
      geofence,
      punchConfig: punchConfig(true),
    });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      invokingUserId: 'user-1',
      punchDeviceId: device.id.toString(),
      latitude: 1, // ~111km from (0,0) — well outside the 100m zone
      longitude: 1,
    });

    expect(result.approvalsCreated).toHaveLength(1);
    expect(result.approvalsCreated[0]?.reason).toBe('OUT_OF_GEOFENCE');
    expect(timeEntries.items).toHaveLength(1);
    expect(approvals.items).toHaveLength(1);
    expect(approvals.items[0]).toBeInstanceOf(PunchApproval);
    expect(approvals.items[0]!.timeEntryId.toString()).toBe(
      timeEntries.items[0]!.id.toString(),
    );
  });

  it('idempotent replay: same requestId returns the existing TimeEntry and skips write', async () => {
    const employee = makeEmployee({ userId: new UniqueEntityID('user-1') });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });
    const timeEntries = new InMemoryTimeEntriesRepository();
    // Prime a "prior" entry with the same requestId.
    const prior = await timeEntries.create({
      tenantId: TENANT_ID,
      employeeId: employee.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2026-04-18T08:00:00Z'),
      nsrNumber: 1,
      requestId: 'dup-key-42',
    });

    const { useCase } = buildUseCase({ employees, timeEntries });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      invokingUserId: 'user-1',
      requestId: 'dup-key-42',
    });

    expect(result.idempotentHit).toBe(true);
    expect(result.timeEntry.id.toString()).toBe(prior.id.toString());
    // Original entry is the only one — no second write.
    expect(timeEntries.items).toHaveLength(1);
  });

  it('device-token path: BadRequestError when employeeId is missing', async () => {
    const devices = new InMemoryPunchDevicesRepository();
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Kiosk 1',
      deviceKind: 'KIOSK_PUBLIC',
    });
    devices.items.push(device);

    const { useCase } = buildUseCase({ devices });

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        punchDeviceId: device.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('device-token path: default-allow when device has no allowlist rows', async () => {
    // prisma allowlist mocks default to count 0 → allow. Direct/dept matches
    // are null by default. An active-employee stub satisfies the rest of
    // the pipeline.
    const employee = makeEmployee();
    const employees = makeEmployeesRepoStub({ byId: employee });

    const devices = new InMemoryPunchDevicesRepository();
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Kiosk 1',
      deviceKind: 'KIOSK_PUBLIC',
    });
    devices.items.push(device);

    const { useCase, timeEntries } = buildUseCase({ employees, devices });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      punchDeviceId: device.id.toString(),
      employeeId: employee.id.toString(),
    });

    expect(result.idempotentHit).toBe(false);
    expect(timeEntries.items).toHaveLength(1);
  });

  it('JWT path: rejects when body.employeeId contradicts the derived one', async () => {
    const employee = makeEmployee({ userId: new UniqueEntityID('user-1') });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });

    const { useCase } = buildUseCase({ employees });

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        invokingUserId: 'user-1',
        employeeId: 'someone-else',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects when pipeline fails WorkSchedule gate (no active shift)', async () => {
    const employee = makeEmployee({ userId: new UniqueEntityID('user-1') });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });

    const { useCase } = buildUseCase({
      employees,
      shifts: withoutShift(),
    });

    await expect(
      useCase.execute({ tenantId: TENANT_ID, invokingUserId: 'user-1' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // ─── Phase 5 / Plan 05-07 — kiosk integration ───────────────────────────

  /**
   * Produces a 128-d Float32Array where a single index is marked. Used to
   * keep Euclidean distance deterministic across the spec.
   */
  function makeEmbedding(mark: number, value: number): Float32Array {
    const arr = new Float32Array(128);
    arr[mark] = value;
    return arr;
  }

  function seedEnrollment(
    faceEnrollments: InMemoryFaceEnrollmentsRepository,
    employee: Employee,
    cadastralVector: Float32Array,
  ) {
    const enc = encryptEmbedding(cadastralVector);
    faceEnrollments.items.push(
      FaceEnrollment.create({
        tenantId: employee.tenantId,
        employeeId: employee.id,
        embedding: enc.ciphertext,
        iv: enc.iv,
        authTag: enc.authTag,
        photoCount: 1,
        capturedAt: new Date(),
        capturedByUserId: new UniqueEntityID('admin-1'),
        consentAuditLogId: null,
      }),
    );
  }

  function sha256Hex(input: string): string {
    // Avoid pulling in node:crypto at module top-level; the module is
    // already imported by the use case but re-importing here keeps the
    // spec self-contained.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('node:crypto')
      .createHash('sha256')
      .update(input)
      .digest('hex');
  }

  it('QR path: resolves employeeId via findByQrTokenHash and creates a TimeEntry', async () => {
    const qrToken = 'a'.repeat(64);
    const qrHash = sha256Hex(qrToken);
    const employee = makeEmployee({
      id: new UniqueEntityID('emp-qr'),
      qrTokenHash: qrHash,
    });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byQrTokenHash: employee,
    });

    const { useCase, timeEntries } = buildUseCase({ employees });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      qrToken,
    });

    expect(result.idempotentHit).toBe(false);
    expect(timeEntries.items).toHaveLength(1);
    expect(result.timeEntry.employeeId.toString()).toBe('emp-qr');
  });

  it('QR path: throws InvalidQRTokenError when no employee matches the hash', async () => {
    const employees = makeEmployeesRepoStub({ byQrTokenHash: null });

    const { useCase } = buildUseCase({ employees });

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        qrToken: 'b'.repeat(64),
      }),
    ).rejects.toMatchObject({ name: 'InvalidQRTokenError' });
  });

  it('PIN path: resolves via matricula + PIN and creates a TimeEntry', async () => {
    const pin = '735194';
    const pinHash = await bcrypt.hash(pin, 4); // low cost for test speed
    const employee = makeEmployee({
      id: new UniqueEntityID('emp-pin'),
      registrationNumber: '12345',
      punchPinHash: pinHash,
    });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byRegistration: employee,
    });

    const { useCase, timeEntries } = buildUseCase({ employees });

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      matricula: '12345',
      pin,
    });

    expect(result.idempotentHit).toBe(false);
    expect(timeEntries.items).toHaveLength(1);
    expect(result.timeEntry.employeeId.toString()).toBe('emp-pin');
  });

  it('PIN path: unknown matricula throws InvalidQRTokenError (enumeration prevention)', async () => {
    const employees = makeEmployeesRepoStub({ byRegistration: null });

    const { useCase } = buildUseCase({ employees });

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        matricula: '99999',
        pin: '123456',
      }),
    ).rejects.toMatchObject({ name: 'InvalidQRTokenError' });
  });

  it('PIN path: wrong PIN propagates PinInvalidError and does NOT mint a batida', async () => {
    const pinHash = await bcrypt.hash('111111', 4);
    const employee = makeEmployee({
      id: new UniqueEntityID('emp-pin-wrong'),
      registrationNumber: '22222',
      punchPinHash: pinHash,
    });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byRegistration: employee,
    });

    const { useCase, timeEntries } = buildUseCase({ employees });

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        matricula: '22222',
        pin: '999999',
      }),
    ).rejects.toMatchObject({ name: 'PinInvalidError' });
    expect(timeEntries.items).toHaveLength(0);
  });

  it('PIN path: locked employee propagates PinLockedError', async () => {
    const pinHash = await bcrypt.hash('111111', 4);
    const employee = makeEmployee({
      id: new UniqueEntityID('emp-pin-locked'),
      registrationNumber: '33333',
      punchPinHash: pinHash,
    });
    // Directly lock the employee via the props (internal test fixture —
    // the entity has no public setter; this mirrors the 05-05 spec pattern).
    (
      employee as unknown as { props: { punchPinLockedUntil: Date } }
    ).props.punchPinLockedUntil = new Date(Date.now() + 10 * 60 * 1000);

    const employees = makeEmployeesRepoStub({
      byId: employee,
      byRegistration: employee,
    });

    const { useCase } = buildUseCase({ employees });

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        matricula: '33333',
        pin: '111111',
      }),
    ).rejects.toMatchObject({ name: 'PinLockedError' });
  });

  it('Face match: ACCEPT when min-distance across enrollments is below threshold', async () => {
    const employee = makeEmployee({ userId: new UniqueEntityID('user-face') });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });
    const faceEnrollments = new InMemoryFaceEnrollmentsRepository();
    // Cadastral: 0.8 on index 0.
    seedEnrollment(faceEnrollments, employee, makeEmbedding(0, 0.8));

    const { useCase, approvals, timeEntries } = buildUseCase({
      employees,
      faceEnrollments,
    });

    // Selfie: 0.5 on index 0 → distance 0.3 < 0.55 default → ACCEPT.
    const result = await useCase.execute({
      tenantId: TENANT_ID,
      invokingUserId: 'user-face',
      faceEmbedding: Array.from(makeEmbedding(0, 0.5)),
    });

    expect(timeEntries.items).toHaveLength(1);
    expect(approvals.items).toHaveLength(0);
    expect(result.approvalsCreated).toEqual([]);
  });

  it('Face match: APPROVAL_REQUIRED when min-distance exceeds threshold → PunchApproval with FACE_MATCH_LOW', async () => {
    const employee = makeEmployee({ userId: new UniqueEntityID('user-low') });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });
    const faceEnrollments = new InMemoryFaceEnrollmentsRepository();
    // Cadastral: 1.2 on index 0.
    seedEnrollment(faceEnrollments, employee, makeEmbedding(0, 1.2));

    const { useCase, approvals, timeEntries } = buildUseCase({
      employees,
      faceEnrollments,
    });

    // Selfie: 0 everywhere → distance 1.2 > 0.55 → APPROVAL_REQUIRED.
    const result = await useCase.execute({
      tenantId: TENANT_ID,
      invokingUserId: 'user-low',
      faceEmbedding: Array.from(new Float32Array(128)),
    });

    expect(timeEntries.items).toHaveLength(1);
    expect(approvals.items).toHaveLength(1);
    expect(result.approvalsCreated[0]?.reason).toBe('FACE_MATCH_LOW');
    expect(result.approvalsCreated[0]?.details).toMatchObject({
      threshold: 0.55,
      enrollmentCount: 1,
    });
  });

  it('Face match: zero enrollments + embedding present → FaceEnrollmentRequiredError', async () => {
    const employee = makeEmployee({
      userId: new UniqueEntityID('user-no-enroll'),
    });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });

    const { useCase } = buildUseCase({ employees });

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        invokingUserId: 'user-no-enroll',
        faceEmbedding: Array.from(makeEmbedding(0, 0.5)),
      }),
    ).rejects.toMatchObject({ name: 'FaceEnrollmentRequiredError' });
  });

  it('Liveness metadata is persisted as-is on TimeEntry.metadata', async () => {
    const employee = makeEmployee({
      userId: new UniqueEntityID('user-liveness'),
    });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byUserId: employee,
    });

    const { useCase, timeEntries } = buildUseCase({ employees });

    await useCase.execute({
      tenantId: TENANT_ID,
      invokingUserId: 'user-liveness',
      liveness: {
        blinkDetected: true,
        trackingFrames: 12,
        durationMs: 1850,
      },
    });

    expect(timeEntries.items).toHaveLength(1);
    expect(timeEntries.items[0]!.metadata).toEqual({
      liveness: {
        blinkDetected: true,
        trackingFrames: 12,
        durationMs: 1850,
      },
    });
  });

  it('Idempotency still works for QR path: same requestId returns the same TimeEntry', async () => {
    const qrToken = 'c'.repeat(64);
    const qrHash = sha256Hex(qrToken);
    const employee = makeEmployee({
      id: new UniqueEntityID('emp-idem'),
      qrTokenHash: qrHash,
    });
    const employees = makeEmployeesRepoStub({
      byId: employee,
      byQrTokenHash: employee,
    });
    const timeEntries = new InMemoryTimeEntriesRepository();

    const { useCase } = buildUseCase({ employees, timeEntries });

    const first = await useCase.execute({
      tenantId: TENANT_ID,
      qrToken,
      requestId: 'kiosk-retry-42',
    });

    const second = await useCase.execute({
      tenantId: TENANT_ID,
      qrToken,
      requestId: 'kiosk-retry-42',
    });

    expect(second.idempotentHit).toBe(true);
    expect(second.timeEntry.id.toString()).toBe(first.timeEntry.id.toString());
    expect(timeEntries.items).toHaveLength(1);
  });
});

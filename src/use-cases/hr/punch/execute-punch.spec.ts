import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
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
import { prisma } from '@/lib/prisma';
import type { AbsencesRepository } from '@/repositories/hr/absences-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { GeofenceZonesRepository } from '@/repositories/hr/geofence-zones-repository';
import { InMemoryPunchApprovalsRepository } from '@/repositories/hr/in-memory/in-memory-punch-approvals-repository';
import { InMemoryPunchDevicesRepository } from '@/repositories/hr/in-memory/in-memory-punch-devices-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';
import type { PunchConfigRepository } from '@/repositories/hr/punch-config-repository';
import type { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';
import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

import { ExecutePunchUseCase } from './execute-punch';
import { AbsenceActiveValidator } from './validators/absence-active.validator';
import { EmployeeActiveValidator } from './validators/employee-active.validator';
import { GeofenceValidator } from './validators/geofence.validator';
import { PunchValidationPipeline } from './validators/pipeline';
import { VacationActiveValidator } from './validators/vacation-active.validator';
import { WorkScheduleValidator } from './validators/work-schedule.validator';

const TENANT_ID = 'tenant-1';

function makeEmployee({
  id = new UniqueEntityID('emp-1'),
  userId,
  status = EmployeeStatus.create('ACTIVE'),
}: {
  id?: UniqueEntityID;
  userId?: UniqueEntityID;
  status?: EmployeeStatus;
} = {}): Employee {
  return Employee.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      registrationNumber: '0001',
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
    },
    id,
  );
}

function makeEmployeesRepoStub(
  overrides: {
    byId?: Employee | null;
    byUserId?: Employee | null;
  } = {},
): EmployeesRepository {
  return {
    findById: vi.fn().mockResolvedValue(overrides.byId ?? null),
    findByUserId: vi.fn().mockResolvedValue(overrides.byUserId ?? null),
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

  const pipeline = new PunchValidationPipeline([
    new EmployeeActiveValidator(employees),
    new VacationActiveValidator(vacations),
    new AbsenceActiveValidator(absences),
    new WorkScheduleValidator(shifts),
    new GeofenceValidator(geofence),
  ]);

  const useCase = new ExecutePunchUseCase(
    timeEntries,
    employees,
    devices,
    approvals,
    configRepo,
    pipeline,
  );

  return { useCase, timeEntries, employees, devices, approvals };
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
});

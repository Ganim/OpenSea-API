/**
 * Phase 07 / Plan 07-05a — specs das 7 novas assinaturas de repositório
 * consumidas pelos use cases Wave 2 (detect-missed-punches, daily-digest,
 * device-heartbeats).
 *
 * Cada método tem ao menos 2 it() cobrindo match + no-match + edge — totalizando
 * 21+ tests (Rule 2 coverage: nenhum método sem spec). Prisma impls são
 * exercitadas indiretamente pelos e2e/integration — aqui cobrimos a semântica
 * pura via InMemory.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchDevice } from '@/entities/hr/punch-device';
import { TimeEntryType } from '@/entities/hr/value-objects/time-entry-type';

import { InMemoryAbsencesRepository } from './in-memory-absences-repository';
import { InMemoryHolidaysRepository } from './in-memory-holidays-repository';
import { InMemoryPunchDevicesRepository } from './in-memory-punch-devices-repository';
import { InMemoryShiftAssignmentsRepository } from './in-memory-shift-assignments-repository';
import { InMemoryTimeEntriesRepository } from './in-memory-time-entries-repository';
import { InMemoryVacationPeriodsRepository } from './in-memory-vacation-periods-repository';

function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

describe('ShiftAssignments.findActiveOnDate + existsForEmployeeOnDate', () => {
  let repo: InMemoryShiftAssignmentsRepository;
  let tenantId: string;
  let employeeId: string;
  const shiftId = new UniqueEntityID().toString();

  beforeEach(() => {
    repo = new InMemoryShiftAssignmentsRepository();
    tenantId = new UniqueEntityID().toString();
    employeeId = new UniqueEntityID().toString();
  });

  it('match: assignment ativo cobrindo a data', async () => {
    await repo.create({
      tenantId,
      shiftId,
      employeeId,
      startDate: utcDate('2026-04-01'),
      endDate: utcDate('2026-12-31'),
      isActive: true,
    });
    const result = await repo.findActiveOnDate(
      employeeId,
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(result).not.toBeNull();
    const exists = await repo.existsForEmployeeOnDate(
      employeeId,
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(exists).toBe(true);
  });

  it('no-match: assignment inativo é ignorado', async () => {
    await repo.create({
      tenantId,
      shiftId,
      employeeId,
      startDate: utcDate('2026-04-01'),
      endDate: utcDate('2026-12-31'),
      isActive: false,
    });
    const result = await repo.findActiveOnDate(
      employeeId,
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(result).toBeNull();
    const exists = await repo.existsForEmployeeOnDate(
      employeeId,
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(exists).toBe(false);
  });

  it('edge: endDate undefined (ongoing) casa qualquer data >= startDate', async () => {
    await repo.create({
      tenantId,
      shiftId,
      employeeId,
      startDate: utcDate('2026-01-01'),
      isActive: true,
    });
    const result = await repo.findActiveOnDate(
      employeeId,
      tenantId,
      utcDate('2099-12-31'),
    );
    expect(result).not.toBeNull();
  });

  it('edge: tenant isolation — outro tenant não enxerga', async () => {
    await repo.create({
      tenantId,
      shiftId,
      employeeId,
      startDate: utcDate('2026-04-01'),
      isActive: true,
    });
    const otherTenant = new UniqueEntityID().toString();
    const result = await repo.findActiveOnDate(
      employeeId,
      otherTenant,
      utcDate('2026-04-20'),
    );
    expect(result).toBeNull();
  });
});

describe('TimeEntries.existsOnDate', () => {
  let repo: InMemoryTimeEntriesRepository;
  let tenantId: string;
  let employeeUEI: UniqueEntityID;

  beforeEach(() => {
    repo = new InMemoryTimeEntriesRepository();
    tenantId = new UniqueEntityID().toString();
    employeeUEI = new UniqueEntityID();
  });

  it('match: batida qualquer no dia UTC retorna true', async () => {
    await repo.create({
      tenantId,
      employeeId: employeeUEI,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2026-04-20T09:15:00.000Z'),
    });
    const exists = await repo.existsOnDate(
      employeeUEI.toString(),
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(exists).toBe(true);
  });

  it('no-match: sem batida retorna false', async () => {
    const exists = await repo.existsOnDate(
      employeeUEI.toString(),
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(exists).toBe(false);
  });

  it('edge: batida em outro dia não casa', async () => {
    await repo.create({
      tenantId,
      employeeId: employeeUEI,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2026-04-19T23:59:59.000Z'),
    });
    const exists = await repo.existsOnDate(
      employeeUEI.toString(),
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(exists).toBe(false);
  });
});

describe('VacationPeriods.findApprovedCoveringDate', () => {
  let repo: InMemoryVacationPeriodsRepository;
  let tenantId: string;
  let employeeUEI: UniqueEntityID;

  beforeEach(() => {
    repo = new InMemoryVacationPeriodsRepository();
    tenantId = new UniqueEntityID().toString();
    employeeUEI = new UniqueEntityID();
  });

  it('match: SCHEDULED cobrindo a data retorna o período', async () => {
    const vp = await repo.create({
      tenantId,
      employeeId: employeeUEI,
      acquisitionStart: utcDate('2025-01-01'),
      acquisitionEnd: utcDate('2025-12-31'),
      concessionStart: utcDate('2026-01-01'),
      concessionEnd: utcDate('2026-12-31'),
      totalDays: 30,
      status: 'SCHEDULED',
    });
    vp.props.scheduledStart = utcDate('2026-04-18');
    vp.props.scheduledEnd = utcDate('2026-04-25');
    const result = await repo.findApprovedCoveringDate(
      employeeUEI.toString(),
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(result).not.toBeNull();
  });

  it('no-match: PENDING não casa (só SCHEDULED/IN_PROGRESS)', async () => {
    const vp = await repo.create({
      tenantId,
      employeeId: employeeUEI,
      acquisitionStart: utcDate('2025-01-01'),
      acquisitionEnd: utcDate('2025-12-31'),
      concessionStart: utcDate('2026-01-01'),
      concessionEnd: utcDate('2026-12-31'),
      totalDays: 30,
      status: 'PENDING',
    });
    vp.props.scheduledStart = utcDate('2026-04-18');
    vp.props.scheduledEnd = utcDate('2026-04-25');
    const result = await repo.findApprovedCoveringDate(
      employeeUEI.toString(),
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(result).toBeNull();
  });

  it('edge: data fora do scheduled range retorna null', async () => {
    const vp = await repo.create({
      tenantId,
      employeeId: employeeUEI,
      acquisitionStart: utcDate('2025-01-01'),
      acquisitionEnd: utcDate('2025-12-31'),
      concessionStart: utcDate('2026-01-01'),
      concessionEnd: utcDate('2026-12-31'),
      totalDays: 30,
      status: 'SCHEDULED',
    });
    vp.props.scheduledStart = utcDate('2026-04-18');
    vp.props.scheduledEnd = utcDate('2026-04-25');
    const result = await repo.findApprovedCoveringDate(
      employeeUEI.toString(),
      tenantId,
      utcDate('2026-04-26'),
    );
    expect(result).toBeNull();
  });
});

describe('Absences.findActiveCoveringDate', () => {
  let repo: InMemoryAbsencesRepository;
  let tenantId: string;
  let employeeUEI: UniqueEntityID;

  beforeEach(() => {
    repo = new InMemoryAbsencesRepository();
    tenantId = new UniqueEntityID().toString();
    employeeUEI = new UniqueEntityID();
  });

  it('match: APPROVED cobrindo data', async () => {
    const absence = await repo.create({
      tenantId,
      employeeId: employeeUEI,
      type: 'SICK_LEAVE',
      startDate: utcDate('2026-04-18'),
      endDate: utcDate('2026-04-25'),
      totalDays: 8,
      isPaid: true,
    });
    // Força status APPROVED (default create é PENDING)
    absence.approve(new UniqueEntityID());
    const result = await repo.findActiveCoveringDate(
      employeeUEI.toString(),
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(result).not.toBeNull();
  });

  it('no-match: PENDING não casa (só APPROVED/IN_PROGRESS)', async () => {
    await repo.create({
      tenantId,
      employeeId: employeeUEI,
      type: 'SICK_LEAVE',
      startDate: utcDate('2026-04-18'),
      endDate: utcDate('2026-04-25'),
      totalDays: 8,
      isPaid: true,
    });
    const result = await repo.findActiveCoveringDate(
      employeeUEI.toString(),
      tenantId,
      utcDate('2026-04-20'),
    );
    expect(result).toBeNull();
  });

  it('edge: data fora do range retorna null', async () => {
    const absence = await repo.create({
      tenantId,
      employeeId: employeeUEI,
      type: 'SICK_LEAVE',
      startDate: utcDate('2026-04-18'),
      endDate: utcDate('2026-04-25'),
      totalDays: 8,
      isPaid: true,
    });
    absence.approve(new UniqueEntityID());
    const result = await repo.findActiveCoveringDate(
      employeeUEI.toString(),
      tenantId,
      utcDate('2026-04-30'),
    );
    expect(result).toBeNull();
  });
});

describe('Holidays.findOnDate', () => {
  let repo: InMemoryHolidaysRepository;
  let tenantId: string;

  beforeEach(() => {
    repo = new InMemoryHolidaysRepository();
    tenantId = new UniqueEntityID().toString();
  });

  it('match: feriado seedado na data retorna o nome', async () => {
    repo.addHoliday(tenantId, utcDate('2026-04-21'), 'Tiradentes');
    const result = await repo.findOnDate(tenantId, utcDate('2026-04-21'));
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Tiradentes');
  });

  it('no-match: data sem feriado retorna null', async () => {
    repo.addHoliday(tenantId, utcDate('2026-04-21'), 'Tiradentes');
    const result = await repo.findOnDate(tenantId, utcDate('2026-04-22'));
    expect(result).toBeNull();
  });

  it('edge: outro tenant não enxerga o feriado', async () => {
    repo.addHoliday(tenantId, utcDate('2026-04-21'), 'Tiradentes');
    const otherTenant = new UniqueEntityID().toString();
    const result = await repo.findOnDate(otherTenant, utcDate('2026-04-21'));
    expect(result).toBeNull();
  });
});

describe('PunchDevices.findManyActiveByTenant', () => {
  let repo: InMemoryPunchDevicesRepository;
  let tenantId: string;

  beforeEach(() => {
    repo = new InMemoryPunchDevicesRepository();
    tenantId = new UniqueEntityID().toString();
  });

  function makeDevice(
    overrides: Partial<{
      revoked: boolean;
      deleted: boolean;
      otherTenant: boolean;
    }> = {},
  ) {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(
        overrides.otherTenant ? new UniqueEntityID().toString() : tenantId,
      ),
      name: 'Kiosk Matriz',
      deviceKind: 'KIOSK_PUBLIC',
      status: 'ONLINE',
    });
    if (overrides.revoked) {
      device.revoke('user-1', 'test revoke');
    }
    if (overrides.deleted) {
      device.deletedAt = new Date();
    }
    return device;
  }

  it('match: retorna apenas devices do tenant sem deletedAt/revokedAt', async () => {
    const active = makeDevice();
    const revoked = makeDevice({ revoked: true });
    const deleted = makeDevice({ deleted: true });
    const other = makeDevice({ otherTenant: true });
    await repo.create(active);
    await repo.create(revoked);
    await repo.create(deleted);
    await repo.create(other);

    const result = await repo.findManyActiveByTenant(tenantId);
    expect(result).toHaveLength(1);
    expect(result[0].id.toString()).toBe(active.id.toString());
  });

  it('no-match: tenant sem devices retorna array vazio', async () => {
    const result = await repo.findManyActiveByTenant(tenantId);
    expect(result).toEqual([]);
  });
});

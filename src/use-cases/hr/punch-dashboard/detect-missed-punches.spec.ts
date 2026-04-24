import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { TimeEntryType } from '@/entities/hr/value-objects/time-entry-type';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryHolidaysRepository } from '@/repositories/hr/in-memory/in-memory-holidays-repository';
import { InMemoryPunchMissedLogRepository } from '@/repositories/hr/in-memory/in-memory-punch-missed-log-repository';
import { InMemoryShiftAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-shift-assignments-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';

import { DetectMissedPunchesUseCase } from './detect-missed-punches';

function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

let punchMissedLogs: InMemoryPunchMissedLogRepository;
let employees: InMemoryEmployeesRepository;
let shifts: InMemoryShiftAssignmentsRepository;
let timeEntries: InMemoryTimeEntriesRepository;
let vacations: InMemoryVacationPeriodsRepository;
let absences: InMemoryAbsencesRepository;
let holidays: InMemoryHolidaysRepository;
let useCase: DetectMissedPunchesUseCase;
let tenantId: string;

async function seedEmployee(
  cpf: string,
  registration: string,
  fullName: string,
) {
  return employees.create({
    tenantId,
    registrationNumber: registration,
    fullName,
    cpf: CPF.create(cpf),
    hireDate: new Date('2024-01-01'),
    status: EmployeeStatus.ACTIVE(),
    baseSalary: 3000,
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 40,
    country: 'Brasil',
  });
}

async function seedShift(employeeId: string) {
  return shifts.create({
    tenantId,
    shiftId: new UniqueEntityID().toString(),
    employeeId,
    startDate: utcDate('2026-01-01'),
    isActive: true,
  });
}

describe('DetectMissedPunchesUseCase', () => {
  beforeEach(() => {
    punchMissedLogs = new InMemoryPunchMissedLogRepository();
    employees = new InMemoryEmployeesRepository();
    shifts = new InMemoryShiftAssignmentsRepository();
    timeEntries = new InMemoryTimeEntriesRepository();
    vacations = new InMemoryVacationPeriodsRepository();
    absences = new InMemoryAbsencesRepository();
    holidays = new InMemoryHolidaysRepository();
    tenantId = new UniqueEntityID().toString();
    useCase = new DetectMissedPunchesUseCase(
      punchMissedLogs,
      employees,
      shifts,
      timeEntries,
      vacations,
      absences,
      holidays,
    );
  });

  it('cria log para funcionário com shift ativo e sem batida no dia', async () => {
    const emp = await seedEmployee('52998224725', 'E001', 'João Silva');
    await seedShift(emp.id.toString());

    const result = await useCase.execute({
      tenantId,
      date: utcDate('2026-04-20'),
      jobId: 'test-job-1',
    });

    expect(result.detected).toBe(1);
    expect(result.createdLogIds).toHaveLength(1);
    expect(result.holidaySkipped).toBe(false);
    expect(punchMissedLogs.items).toHaveLength(1);
    expect(punchMissedLogs.items[0].generatedByJobId).toBe('test-job-1');
  });

  it('skipa funcionário sem ShiftAssignment ativa', async () => {
    await seedEmployee('52998224725', 'E001', 'Sem Shift');

    const result = await useCase.execute({
      tenantId,
      date: utcDate('2026-04-20'),
    });

    expect(result.detected).toBe(0);
    expect(result.skippedEmployees).toBe(1);
    expect(punchMissedLogs.items).toHaveLength(0);
  });

  it('skipa funcionário que bateu na data (TimeEntry existe)', async () => {
    const emp = await seedEmployee('52998224725', 'E001', 'Bateu');
    await seedShift(emp.id.toString());
    await timeEntries.create({
      tenantId,
      employeeId: emp.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2026-04-20T09:00:00.000Z'),
    });

    const result = await useCase.execute({
      tenantId,
      date: utcDate('2026-04-20'),
    });

    expect(result.detected).toBe(0);
    expect(punchMissedLogs.items).toHaveLength(0);
  });

  it('skipa funcionário com VacationPeriod SCHEDULED cobrindo a data', async () => {
    const emp = await seedEmployee('52998224725', 'E001', 'Férias');
    await seedShift(emp.id.toString());
    const vp = await vacations.create({
      tenantId,
      employeeId: emp.id,
      acquisitionStart: utcDate('2025-01-01'),
      acquisitionEnd: utcDate('2025-12-31'),
      concessionStart: utcDate('2026-01-01'),
      concessionEnd: utcDate('2026-12-31'),
      totalDays: 30,
      status: 'SCHEDULED',
    });
    vp.props.scheduledStart = utcDate('2026-04-18');
    vp.props.scheduledEnd = utcDate('2026-04-25');

    const result = await useCase.execute({
      tenantId,
      date: utcDate('2026-04-20'),
    });

    expect(result.detected).toBe(0);
  });

  it('skipa funcionário com Absence APPROVED cobrindo a data', async () => {
    const emp = await seedEmployee('52998224725', 'E001', 'Atestado');
    await seedShift(emp.id.toString());
    const absence = await absences.create({
      tenantId,
      employeeId: emp.id,
      type: 'SICK_LEAVE',
      startDate: utcDate('2026-04-19'),
      endDate: utcDate('2026-04-22'),
      totalDays: 4,
      isPaid: true,
    });
    absence.approve(new UniqueEntityID());

    const result = await useCase.execute({
      tenantId,
      date: utcDate('2026-04-20'),
    });

    expect(result.detected).toBe(0);
  });

  it('skipa TUDO quando há Holiday tenant-wide', async () => {
    const empA = await seedEmployee('52998224725', 'E001', 'A');
    const empB = await seedEmployee('12345678909', 'E002', 'B');
    await seedShift(empA.id.toString());
    await seedShift(empB.id.toString());
    holidays.addHoliday(tenantId, utcDate('2026-04-21'), 'Tiradentes');

    const result = await useCase.execute({
      tenantId,
      date: utcDate('2026-04-21'),
    });

    expect(result.holidaySkipped).toBe(true);
    expect(result.detected).toBe(0);
    expect(punchMissedLogs.items).toHaveLength(0);
  });

  it('idempotente: race P2002 retorna skippedExisting++ sem lançar', async () => {
    const emp = await seedEmployee('52998224725', 'E001', 'Dup');
    await seedShift(emp.id.toString());
    // Simula que o UNIQUE já tinha um log — forçamos o create a lançar P2002.
    const createSpy = vi
      .spyOn(punchMissedLogs, 'create')
      .mockRejectedValueOnce(
        Object.assign(new Error('unique constraint'), { code: 'P2002' }),
      );

    const result = await useCase.execute({
      tenantId,
      date: utcDate('2026-04-20'),
    });

    expect(result.detected).toBe(0);
    expect(result.skippedExisting).toBe(1);
    createSpy.mockRestore();
  });

  it('erro não-P2002 do repo é propagado', async () => {
    const emp = await seedEmployee('52998224725', 'E001', 'Err');
    await seedShift(emp.id.toString());
    vi.spyOn(punchMissedLogs, 'create').mockRejectedValueOnce(
      new Error('boom'),
    );

    await expect(
      useCase.execute({ tenantId, date: utcDate('2026-04-20') }),
    ).rejects.toThrow(/boom/);
  });

  it('retorna contadores agregados (detected + skippedExisting + skippedEmployees)', async () => {
    const empA = await seedEmployee('52998224725', 'E001', 'A');
    const empB = await seedEmployee('12345678909', 'E002', 'B');
    await seedShift(empA.id.toString());
    // empB sem shift → skipped
    await timeEntries.create({
      tenantId,
      employeeId: empA.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2026-04-20T09:00:00.000Z'),
    });
    // empA bateu → skipped

    const result = await useCase.execute({
      tenantId,
      date: utcDate('2026-04-20'),
    });

    expect(result.detected).toBe(0);
    expect(result.skippedEmployees).toBe(2);
    expect(result.skippedExisting).toBe(0);
  });
});

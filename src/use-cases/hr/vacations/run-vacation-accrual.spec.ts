import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RunVacationAccrualUseCase } from './run-vacation-accrual';

const tenantId = new UniqueEntityID().toString();

let employeesRepository: InMemoryEmployeesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: RunVacationAccrualUseCase;

async function createEmployee({
  hireDate,
  registrationNumber = 'EMP001',
  cpf = '529.982.247-25',
  active = true,
}: {
  hireDate: Date;
  registrationNumber?: string;
  cpf?: string;
  active?: boolean;
}) {
  return employeesRepository.create({
    tenantId,
    registrationNumber,
    fullName: `Employee ${registrationNumber}`,
    cpf: CPF.create(cpf),
    hireDate,
    status: active ? EmployeeStatus.ACTIVE() : EmployeeStatus.TERMINATED(),
    baseSalary: 3000,
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'Brasil',
  });
}

describe('Run Vacation Accrual Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new RunVacationAccrualUseCase(
      employeesRepository,
      vacationPeriodsRepository,
    );
  });

  it('does not create a period for employees below 12 months', async () => {
    await createEmployee({ hireDate: new Date('2026-01-01') });
    const result = await sut.execute({
      tenantId,
      referenceDate: new Date('2026-06-01'),
    });
    expect(result.createdPeriods).toBe(0);
    expect(result.skippedPeriods).toBe(1);
    expect(result.evaluatedEmployees).toBe(1);
  });

  it('creates one PENDING period when employee hits first anniversary', async () => {
    const employee = await createEmployee({
      hireDate: new Date('2025-04-16'),
    });
    const result = await sut.execute({
      tenantId,
      referenceDate: new Date('2026-04-16'),
    });
    expect(result.createdPeriods).toBe(1);
    const periods = await vacationPeriodsRepository.findManyByEmployeeAndStatus(
      employee.id,
      'PENDING',
      tenantId,
    );
    expect(periods).toHaveLength(1);
    expect(periods[0].acquisitionStart.toISOString().slice(0, 10)).toBe(
      '2025-04-16',
    );
  });

  it('is idempotent: re-running the same day skips creation', async () => {
    await createEmployee({ hireDate: new Date('2025-04-16') });
    const ref = new Date('2026-04-16');
    const first = await sut.execute({ tenantId, referenceDate: ref });
    const second = await sut.execute({ tenantId, referenceDate: ref });
    expect(first.createdPeriods).toBe(1);
    expect(second.createdPeriods).toBe(0);
    expect(second.skippedPeriods).toBe(1);
  });

  it('ignores inactive employees', async () => {
    await createEmployee({
      hireDate: new Date('2025-01-01'),
      active: false,
    });
    const result = await sut.execute({
      tenantId,
      referenceDate: new Date('2026-04-16'),
    });
    expect(result.evaluatedEmployees).toBe(0);
    expect(result.createdPeriods).toBe(0);
  });

  it('creates a period for the current cycle, not older ones', async () => {
    // Hired in 2023; on 2026-04-16 the current acquisitive cycle is
    // 2025-01-01 .. 2025-12-31.
    const employee = await createEmployee({
      hireDate: new Date('2023-01-01'),
    });
    const result = await sut.execute({
      tenantId,
      referenceDate: new Date('2026-04-16'),
    });
    expect(result.createdPeriods).toBe(1);
    const periods = await vacationPeriodsRepository.findManyByEmployeeAndStatus(
      employee.id,
      'PENDING',
      tenantId,
    );
    // Acquisition must start at the most recent anniversary at-or-before ref.
    expect(periods[0].acquisitionStart.toISOString().slice(0, 10)).toBe(
      '2025-01-01',
    );
  });
});

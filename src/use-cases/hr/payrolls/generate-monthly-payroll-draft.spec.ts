import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateMonthlyPayrollDraftUseCase } from './generate-monthly-payroll-draft';

const tenantId = new UniqueEntityID().toString();
const otherTenantId = new UniqueEntityID().toString();

let employeesRepository: InMemoryEmployeesRepository;
let payrollsRepository: InMemoryPayrollsRepository;
let sut: GenerateMonthlyPayrollDraftUseCase;

async function createEmployee({
  registrationNumber = 'EMP001',
  cpf = '529.982.247-25',
  inTenant = tenantId,
  active = true,
}: {
  registrationNumber?: string;
  cpf?: string;
  inTenant?: string;
  active?: boolean;
} = {}) {
  return employeesRepository.create({
    tenantId: inTenant,
    registrationNumber,
    fullName: `Employee ${registrationNumber}`,
    cpf: CPF.create(cpf),
    hireDate: new Date('2024-01-01'),
    status: active ? EmployeeStatus.ACTIVE() : EmployeeStatus.TERMINATED(),
    baseSalary: 3000,
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'Brasil',
  });
}

describe('Generate Monthly Payroll Draft Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    payrollsRepository = new InMemoryPayrollsRepository();
    sut = new GenerateMonthlyPayrollDraftUseCase(
      employeesRepository,
      payrollsRepository,
    );
  });

  it('creates a DRAFT payroll for the reference month when none exists', async () => {
    await createEmployee();
    const ref = new Date('2026-04-25T09:00:00Z');

    const result = await sut.execute({ tenantId, referenceDate: ref });

    expect(result.alreadyExisted).toBe(false);
    expect(result.referenceMonth).toBe(4);
    expect(result.referenceYear).toBe(2026);
    expect(result.evaluatedEmployees).toBe(1);
    expect(result.payroll).not.toBeNull();
    expect(result.payroll?.status.value).toBe('DRAFT');
    expect(payrollsRepository.items).toHaveLength(1);
  });

  it('is idempotent: second run returns the existing payroll without duplicating', async () => {
    await createEmployee();
    const ref = new Date('2026-04-25T09:00:00Z');

    const first = await sut.execute({ tenantId, referenceDate: ref });
    const second = await sut.execute({ tenantId, referenceDate: ref });

    expect(first.alreadyExisted).toBe(false);
    expect(second.alreadyExisted).toBe(true);
    expect(second.payroll?.id.equals(first.payroll!.id)).toBe(true);
    expect(payrollsRepository.items).toHaveLength(1);
  });

  it('does nothing when the tenant has zero active employees', async () => {
    const result = await sut.execute({
      tenantId,
      referenceDate: new Date('2026-04-25T09:00:00Z'),
    });

    expect(result.payroll).toBeNull();
    expect(result.evaluatedEmployees).toBe(0);
    expect(result.alreadyExisted).toBe(false);
    expect(payrollsRepository.items).toHaveLength(0);
  });

  it('ignores terminated employees from the active count', async () => {
    await createEmployee({
      registrationNumber: 'EMP001',
      cpf: '529.982.247-25',
      active: true,
    });
    await createEmployee({
      registrationNumber: 'EMP002',
      cpf: '390.533.447-05',
      active: false,
    });

    const result = await sut.execute({
      tenantId,
      referenceDate: new Date('2026-04-25T09:00:00Z'),
    });

    expect(result.evaluatedEmployees).toBe(1);
    expect(result.payroll).not.toBeNull();
  });

  it('derives the reference month and year from the supplied referenceDate', async () => {
    await createEmployee();

    const result = await sut.execute({
      tenantId,
      referenceDate: new Date('2026-11-25T09:00:00Z'),
    });

    expect(result.referenceMonth).toBe(11);
    expect(result.referenceYear).toBe(2026);
  });

  it('defaults referenceDate to now when none is provided', async () => {
    await createEmployee();
    const now = new Date();

    const result = await sut.execute({ tenantId });

    expect(result.referenceMonth).toBe(now.getMonth() + 1);
    expect(result.referenceYear).toBe(now.getFullYear());
  });

  it('does not bleed payroll drafts across tenants', async () => {
    await createEmployee({ inTenant: otherTenantId });

    const result = await sut.execute({
      tenantId,
      referenceDate: new Date('2026-04-25T09:00:00Z'),
    });

    // The other tenant has the only active employee, so this tenant sees none.
    expect(result.evaluatedEmployees).toBe(0);
    expect(result.payroll).toBeNull();
    expect(payrollsRepository.items).toHaveLength(0);
  });
});

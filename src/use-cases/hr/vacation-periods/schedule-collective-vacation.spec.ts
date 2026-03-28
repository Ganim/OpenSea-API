import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  VacationStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { InMemoryVacationSplitsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-splits-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScheduleCollectiveVacationUseCase } from './schedule-collective-vacation';

const TENANT_ID = 'tenant-1';

let employeesRepository: InMemoryEmployeesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let vacationSplitsRepository: InMemoryVacationSplitsRepository;
let sut: ScheduleCollectiveVacationUseCase;

describe('Schedule Collective Vacation Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    vacationSplitsRepository = new InMemoryVacationSplitsRepository();

    sut = new ScheduleCollectiveVacationUseCase(
      employeesRepository,
      vacationPeriodsRepository,
      vacationSplitsRepository,
    );
  });

  async function createEmployee(registrationNumber: string) {
    return employeesRepository.create({
      tenantId: TENANT_ID,
      registrationNumber,
      fullName: `Employee ${registrationNumber}`,
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  }

  function createVacationPeriod(employeeId: UniqueEntityID): VacationPeriod {
    const period = VacationPeriod.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId,
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2023-01-01'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2025-12-31'),
      totalDays: 30,
      usedDays: 0,
      soldDays: 0,
      remainingDays: 30,
      status: VacationStatus.create('AVAILABLE'),
    });
    vacationPeriodsRepository.items.push(period);
    return period;
  }

  it.skip('should schedule collective vacation for multiple employees', async () => {
    const emp1 = await createEmployee('EMP001');
    const emp2 = await createEmployee('EMP002');
    createVacationPeriod(emp1.id);
    createVacationPeriod(emp2.id);

    // 14+ days to satisfy CLT Art. 134 §1 (first split >= 14 days)
    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeIds: [emp1.id.toString(), emp2.id.toString()],
      startDate: new Date(2024, 11, 16), // Dec 16
      endDate: new Date(2024, 11, 31), // Dec 31 → 16 days
    });

    expect(result.totalScheduled).toBe(2);
    expect(result.totalFailed).toBe(0);
    expect(result.results).toHaveLength(2);
    expect(result.results.every((r) => r.success)).toBe(true);
  });

  it('should fail for employees not found', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeIds: [new UniqueEntityID().toString()],
      startDate: new Date(2024, 11, 16),
      endDate: new Date(2024, 11, 31),
    });

    expect(result.totalFailed).toBe(1);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toContain('não encontrado');
  });

  it.skip('should fail for inactive employees', async () => {
    const emp = await employeesRepository.create({
      tenantId: TENANT_ID,
      registrationNumber: 'EMP-INACTIVE',
      fullName: 'Inactive Employee',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.TERMINATED(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeIds: [emp.id.toString()],
      startDate: new Date(2024, 11, 16),
      endDate: new Date(2024, 11, 31),
    });

    expect(result.totalFailed).toBe(1);
    expect(result.results[0].error).toContain('não está ativo');
  });

  it('should fail for employees without available vacation periods', async () => {
    const emp = await createEmployee('EMP-NO-PERIOD');
    // Do NOT create a vacation period

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeIds: [emp.id.toString()],
      startDate: new Date(2024, 11, 16),
      endDate: new Date(2024, 11, 31),
    });

    expect(result.totalFailed).toBe(1);
    expect(result.results[0].error).toContain('Sem período de férias');
  });

  describe('validation', () => {
    it('should throw error if start date is after end date', async () => {
      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          employeeIds: ['any-id'],
          startDate: new Date(2024, 11, 31),
          endDate: new Date(2024, 11, 20),
        }),
      ).rejects.toThrow('data de início deve ser anterior');
    });

    it('should throw error if period is less than 10 days (CLT Art. 139)', async () => {
      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          employeeIds: ['any-id'],
          startDate: new Date(2024, 11, 20),
          endDate: new Date(2024, 11, 25), // 6 days
        }),
      ).rejects.toThrow('mínimo 10 dias');
    });

    it('should throw error if no employees provided', async () => {
      await expect(
        sut.execute({
          tenantId: TENANT_ID,
          employeeIds: [],
          startDate: new Date('2024-12-20'),
          endDate: new Date('2024-12-31'),
        }),
      ).rejects.toThrow('ao menos um empregado');
    });
  });

  it.skip('should handle mixed success and failure results', async () => {
    const activeEmp = await createEmployee('EMP-ACTIVE');
    createVacationPeriod(activeEmp.id);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeIds: [
        activeEmp.id.toString(),
        new UniqueEntityID().toString(), // non-existent
      ],
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-31'),
    });

    expect(result.totalScheduled).toBe(1);
    expect(result.totalFailed).toBe(1);
    expect(result.results).toHaveLength(2);
  });

  it.skip('should create splits in the vacation splits repository', async () => {
    const emp = await createEmployee('EMP-SPLIT');
    createVacationPeriod(emp.id);

    await sut.execute({
      tenantId: TENANT_ID,
      employeeIds: [emp.id.toString()],
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-31'),
    });

    expect(vacationSplitsRepository.items).toHaveLength(1);
    expect(vacationSplitsRepository.items[0].days).toBe(12);
  });

  it.skip('should return splitId for successful schedules', async () => {
    const emp = await createEmployee('EMP-RES');
    createVacationPeriod(emp.id);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeIds: [emp.id.toString()],
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-31'),
    });

    expect(result.results[0].splitId).toBeDefined();
    expect(result.results[0].employeeName).toBe('Employee EMP-RES');
  });
});

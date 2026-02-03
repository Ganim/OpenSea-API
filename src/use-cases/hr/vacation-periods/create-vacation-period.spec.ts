import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateVacationPeriodUseCase } from './create-vacation-period';

const TENANT_ID = 'tenant-1';

let employeesRepository: InMemoryEmployeesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: CreateVacationPeriodUseCase;
let testEmployee: Employee;

describe('Create Vacation Period Use Case', () => {
  beforeEach(async () => {
    employeesRepository = new InMemoryEmployeesRepository();
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new CreateVacationPeriodUseCase(
      employeesRepository,
      vacationPeriodsRepository,
    );

    testEmployee = await employeesRepository.create({
      tenantId: TENANT_ID,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should create vacation period successfully', async () => {
    const acquisitionStart = new Date('2022-01-01');
    const acquisitionEnd = new Date('2023-01-01');
    const concessionStart = new Date('2023-01-01');
    const concessionEnd = new Date('2024-12-31');

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: testEmployee.id.toString(),
      acquisitionStart,
      acquisitionEnd,
      concessionStart,
      concessionEnd,
    });

    expect(result.vacationPeriod).toBeDefined();
    expect(result.vacationPeriod.employeeId.equals(testEmployee.id)).toBe(true);
    expect(result.vacationPeriod.totalDays).toBe(30);
    expect(result.vacationPeriod.remainingDays).toBe(30);
    expect(result.vacationPeriod.usedDays).toBe(0);
    expect(result.vacationPeriod.soldDays).toBe(0);
  });

  it('should create vacation period with custom total days', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: testEmployee.id.toString(),
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2023-01-01'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2024-12-31'),
      totalDays: 20, // Reduced due to absences
    });

    expect(result.vacationPeriod.totalDays).toBe(20);
    expect(result.vacationPeriod.remainingDays).toBe(20);
  });

  it('should throw error if employee not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        employeeId: new UniqueEntityID().toString(),
        acquisitionStart: new Date('2022-01-01'),
        acquisitionEnd: new Date('2023-01-01'),
        concessionStart: new Date('2023-01-01'),
        concessionEnd: new Date('2024-12-31'),
      }),
    ).rejects.toThrow('Employee');
  });
});

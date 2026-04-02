import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  VacationStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateVacationPeriodUseCase } from './update-vacation-period';

const TENANT_ID = 'tenant-1';

let employeesRepository: InMemoryEmployeesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: UpdateVacationPeriodUseCase;
let testEmployee: Employee;

async function createTestVacationPeriod(
  overrides: Partial<{
    status: VacationStatus;
    totalDays: number;
    soldDays: number;
    usedDays: number;
    remainingDays: number;
  }> = {},
) {
  const totalDays = overrides.totalDays ?? 30;
  const usedDays = overrides.usedDays ?? 0;
  const soldDays = overrides.soldDays ?? 0;
  const remainingDays =
    overrides.remainingDays ?? totalDays - usedDays - soldDays;

  return vacationPeriodsRepository.create({
    tenantId: TENANT_ID,
    employeeId: testEmployee.id,
    acquisitionStart: new Date('2022-01-01'),
    acquisitionEnd: new Date('2023-01-01'),
    concessionStart: new Date('2023-01-01'),
    concessionEnd: new Date('2024-12-31'),
    totalDays,
    usedDays,
    soldDays,
    remainingDays,
    status: overrides.status?.value ?? 'AVAILABLE',
  });
}

describe('Update Vacation Period Use Case', () => {
  beforeEach(async () => {
    employeesRepository = new InMemoryEmployeesRepository();
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new UpdateVacationPeriodUseCase(vacationPeriodsRepository);

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

  it('should update vacation period notes successfully', async () => {
    const createdPeriod = await createTestVacationPeriod();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      periodId: createdPeriod.id.toString(),
      notes: 'Updated notes',
    });

    expect(result.vacationPeriod.notes).toBe('Updated notes');
  });

  it('should update vacation period totalDays and recalculate remainingDays', async () => {
    const createdPeriod = await createTestVacationPeriod();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      periodId: createdPeriod.id.toString(),
      totalDays: 20,
    });

    expect(result.vacationPeriod.totalDays).toBe(20);
    expect(result.vacationPeriod.remainingDays).toBe(20);
  });

  it('should update scheduled dates', async () => {
    const createdPeriod = await createTestVacationPeriod();

    const scheduledStart = new Date('2024-06-01');
    const scheduledEnd = new Date('2024-06-30');

    const result = await sut.execute({
      tenantId: TENANT_ID,
      periodId: createdPeriod.id.toString(),
      scheduledStart,
      scheduledEnd,
    });

    expect(result.vacationPeriod.scheduledStart).toEqual(scheduledStart);
    expect(result.vacationPeriod.scheduledEnd).toEqual(scheduledEnd);
  });

  it('should throw error if vacation period not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        periodId: new UniqueEntityID().toString(),
        notes: 'Updated notes',
      }),
    ).rejects.toThrow('Período de férias não encontrado');
  });

  it('should throw error if vacation period is completed', async () => {
    const createdPeriod = await createTestVacationPeriod();

    // Mark as scheduled, then complete
    createdPeriod.schedule(new Date('2024-06-01'), new Date('2024-06-30'), 30);
    createdPeriod.startVacation();
    createdPeriod.complete(30);
    await vacationPeriodsRepository.save(createdPeriod);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        periodId: createdPeriod.id.toString(),
        notes: 'Updated notes',
      }),
    ).rejects.toThrow(
      'Somente períodos de férias pendentes ou disponíveis podem ser editados',
    );
  });

  it('should throw error if vacation period is in progress', async () => {
    const createdPeriod = await createTestVacationPeriod();

    // Schedule and start vacation
    createdPeriod.schedule(new Date('2024-06-01'), new Date('2024-06-30'), 30);
    createdPeriod.startVacation();
    await vacationPeriodsRepository.save(createdPeriod);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        periodId: createdPeriod.id.toString(),
        notes: 'Updated notes',
      }),
    ).rejects.toThrow(
      'Somente períodos de férias pendentes ou disponíveis podem ser editados',
    );
  });

  it('should throw error if scheduled end is before scheduled start', async () => {
    const createdPeriod = await createTestVacationPeriod();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        periodId: createdPeriod.id.toString(),
        scheduledStart: new Date('2024-06-30'),
        scheduledEnd: new Date('2024-06-01'),
      }),
    ).rejects.toThrow('A data de término deve ser posterior à data de início');
  });

  it('should throw error if totalDays is too low after used/sold days', async () => {
    const createdPeriod = await createTestVacationPeriod({
      totalDays: 30,
      soldDays: 10,
      remainingDays: 20,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        periodId: createdPeriod.id.toString(),
        totalDays: 5,
      }),
    ).rejects.toThrow(
      'O total de dias não pode ser menor que os dias já utilizados e vendidos',
    );
  });
});

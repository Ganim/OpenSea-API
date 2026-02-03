import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryBonusesRepository } from '@/repositories/hr/in-memory/in-memory-bonuses-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBonusesUseCase } from './list-bonuses';

let bonusesRepository: InMemoryBonusesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ListBonusesUseCase;
let testEmployee1: Employee;
let testEmployee2: Employee;

const tenantId = new UniqueEntityID().toString();

describe('List Bonuses Use Case', () => {
  beforeEach(async () => {
    bonusesRepository = new InMemoryBonusesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ListBonusesUseCase(bonusesRepository);

    testEmployee1 = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee 1',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    testEmployee2 = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Test Employee 2',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 6000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should list all bonuses', async () => {
    await bonusesRepository.create({
      tenantId,
      employeeId: testEmployee1.id,
      name: 'Bonus 1',
      amount: 500,
      reason: 'Reason 1',
      date: new Date(),
    });

    await bonusesRepository.create({
      tenantId,
      employeeId: testEmployee2.id,
      name: 'Bonus 2',
      amount: 1000,
      reason: 'Reason 2',
      date: new Date(),
    });

    const result = await sut.execute({ tenantId });

    expect(result.bonuses).toHaveLength(2);
  });

  it('should filter bonuses by employee', async () => {
    await bonusesRepository.create({
      tenantId,
      employeeId: testEmployee1.id,
      name: 'Bonus 1',
      amount: 500,
      reason: 'Reason 1',
      date: new Date(),
    });

    await bonusesRepository.create({
      tenantId,
      employeeId: testEmployee2.id,
      name: 'Bonus 2',
      amount: 1000,
      reason: 'Reason 2',
      date: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee1.id.toString(),
    });

    expect(result.bonuses).toHaveLength(1);
    expect(result.bonuses[0].employeeId.equals(testEmployee1.id)).toBe(true);
  });

  it('should filter bonuses by paid status', async () => {
    const bonus = await bonusesRepository.create({
      tenantId,
      employeeId: testEmployee1.id,
      name: 'Paid Bonus',
      amount: 500,
      reason: 'Reason',
      date: new Date(),
    });

    bonus.markAsPaid(testEmployee1.id);
    await bonusesRepository.save(bonus);

    await bonusesRepository.create({
      tenantId,
      employeeId: testEmployee1.id,
      name: 'Unpaid Bonus',
      amount: 1000,
      reason: 'Reason 2',
      date: new Date(),
    });

    const paidResult = await sut.execute({ tenantId, isPaid: true });
    expect(paidResult.bonuses).toHaveLength(1);
    expect(paidResult.bonuses[0].isPaid).toBe(true);

    const unpaidResult = await sut.execute({ tenantId, isPaid: false });
    expect(unpaidResult.bonuses).toHaveLength(1);
    expect(unpaidResult.bonuses[0].isPaid).toBe(false);
  });

  it('should return empty array when no bonuses exist', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.bonuses).toHaveLength(0);
  });
});

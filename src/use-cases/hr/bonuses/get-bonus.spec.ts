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
import { GetBonusUseCase } from './get-bonus';

let bonusesRepository: InMemoryBonusesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: GetBonusUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Get Bonus Use Case', () => {
  beforeEach(async () => {
    bonusesRepository = new InMemoryBonusesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GetBonusUseCase(bonusesRepository);

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should get a bonus by id', async () => {
    const createdBonus = await bonusesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent performance',
      date: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      bonusId: createdBonus.id.toString(),
    });

    expect(result.bonus).toBeDefined();
    expect(result.bonus.id.equals(createdBonus.id)).toBe(true);
    expect(result.bonus.name).toBe('Performance Bonus');
    expect(result.bonus.amount).toBe(1000);
  });

  it('should throw error if bonus not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        bonusId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Bônus não encontrado');
  });
});

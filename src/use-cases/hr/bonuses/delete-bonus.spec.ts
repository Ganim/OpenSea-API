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
import { DeleteBonusUseCase } from './delete-bonus';

let bonusesRepository: InMemoryBonusesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: DeleteBonusUseCase;
let testEmployee: Employee;

describe('Delete Bonus Use Case', () => {
  beforeEach(async () => {
    bonusesRepository = new InMemoryBonusesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new DeleteBonusUseCase(bonusesRepository);

    testEmployee = await employeesRepository.create({
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

  it('should delete a bonus successfully', async () => {
    const bonus = await bonusesRepository.create({
      employeeId: testEmployee.id,
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent performance',
      date: new Date(),
    });

    await sut.execute({
      bonusId: bonus.id.toString(),
    });

    const foundBonus = await bonusesRepository.findById(bonus.id);
    expect(foundBonus).toBeNull();
  });

  it('should throw error if bonus not found', async () => {
    await expect(
      sut.execute({
        bonusId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Bônus não encontrado');
  });

  it('should throw error if bonus is already paid', async () => {
    const bonus = await bonusesRepository.create({
      employeeId: testEmployee.id,
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent performance',
      date: new Date(),
    });

    // Mark as paid
    bonus.markAsPaid(new UniqueEntityID());
    await bonusesRepository.save(bonus);

    await expect(
      sut.execute({
        bonusId: bonus.id.toString(),
      }),
    ).rejects.toThrow('Não é possível excluir um bônus já pago');
  });
});

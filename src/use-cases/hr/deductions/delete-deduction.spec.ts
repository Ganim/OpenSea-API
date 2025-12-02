import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
    ContractType,
    CPF,
    EmployeeStatus,
    WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryDeductionsRepository } from '@/repositories/hr/in-memory/in-memory-deductions-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteDeductionUseCase } from './delete-deduction';

let deductionsRepository: InMemoryDeductionsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: DeleteDeductionUseCase;
let testEmployee: Employee;

describe('Delete Deduction Use Case', () => {
  beforeEach(async () => {
    deductionsRepository = new InMemoryDeductionsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new DeleteDeductionUseCase(deductionsRepository);

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

  it('should delete a deduction successfully', async () => {
    const deduction = await deductionsRepository.create({
      employeeId: testEmployee.id,
      name: 'Loan Payment',
      amount: 500,
      reason: 'Personal loan repayment',
      date: new Date(),
    });

    await sut.execute({
      deductionId: deduction.id.toString(),
    });

    const foundDeduction = await deductionsRepository.findById(deduction.id);
    expect(foundDeduction).toBeNull();
  });

  it('should throw error if deduction not found', async () => {
    await expect(
      sut.execute({
        deductionId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Dedução não encontrada');
  });

  it('should throw error if deduction has already been applied', async () => {
    const deduction = await deductionsRepository.create({
      employeeId: testEmployee.id,
      name: 'Loan Payment',
      amount: 500,
      reason: 'Personal loan repayment',
      date: new Date(),
    });

    // Mark as applied
    deduction.markAsApplied(new UniqueEntityID());
    await deductionsRepository.save(deduction);

    await expect(
      sut.execute({
        deductionId: deduction.id.toString(),
      }),
    ).rejects.toThrow('Não é possível excluir uma dedução já aplicada');
  });
});

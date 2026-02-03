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
import { GetDeductionUseCase } from './get-deduction';

let deductionsRepository: InMemoryDeductionsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: GetDeductionUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Get Deduction Use Case', () => {
  beforeEach(async () => {
    deductionsRepository = new InMemoryDeductionsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GetDeductionUseCase(deductionsRepository);

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

  it('should get a deduction by id', async () => {
    const createdDeduction = await deductionsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      name: 'Loan Payment',
      amount: 500,
      reason: 'Personal loan repayment',
      date: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      deductionId: createdDeduction.id.toString(),
    });

    expect(result.deduction).toBeDefined();
    expect(result.deduction.id.equals(createdDeduction.id)).toBe(true);
    expect(result.deduction.name).toBe('Loan Payment');
    expect(result.deduction.amount).toBe(500);
  });

  it('should throw error if deduction not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        deductionId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Dedução não encontrada');
  });
});

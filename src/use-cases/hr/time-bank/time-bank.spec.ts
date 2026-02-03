import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTimeBankRepository } from '@/repositories/hr/in-memory/in-memory-time-bank-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreditTimeBankUseCase } from './credit-time-bank';
import { DebitTimeBankUseCase } from './debit-time-bank';
import { GetTimeBankUseCase } from './get-time-bank';

const TENANT_ID = 'tenant-1';

let timeBankRepository: InMemoryTimeBankRepository;
let employeesRepository: InMemoryEmployeesRepository;
let getTimeBankUseCase: GetTimeBankUseCase;
let creditTimeBankUseCase: CreditTimeBankUseCase;
let debitTimeBankUseCase: DebitTimeBankUseCase;
let testEmployee: Employee;

describe('Time Bank Use Cases', () => {
  beforeEach(async () => {
    timeBankRepository = new InMemoryTimeBankRepository();
    employeesRepository = new InMemoryEmployeesRepository();

    getTimeBankUseCase = new GetTimeBankUseCase(
      timeBankRepository,
      employeesRepository,
    );
    creditTimeBankUseCase = new CreditTimeBankUseCase(
      timeBankRepository,
      employeesRepository,
    );
    debitTimeBankUseCase = new DebitTimeBankUseCase(
      timeBankRepository,
      employeesRepository,
    );

    testEmployee = await employeesRepository.create({
      tenantId: TENANT_ID,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date(),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  describe('Get Time Bank', () => {
    it('should create time bank if not exists', async () => {
      const result = await getTimeBankUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id.toString(),
        year: 2024,
      });

      expect(result.timeBank).toBeDefined();
      expect(result.timeBank.balance).toBe(0);
      expect(result.timeBank.year).toBe(2024);
    });

    it('should return existing time bank', async () => {
      await timeBankRepository.create({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id,
        balance: 10,
        year: 2024,
      });

      const result = await getTimeBankUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id.toString(),
        year: 2024,
      });

      expect(result.timeBank.balance).toBe(10);
    });

    it('should throw error if employee not found', async () => {
      await expect(
        getTimeBankUseCase.execute({
          tenantId: TENANT_ID,
          employeeId: new UniqueEntityID().toString(),
          year: 2024,
        }),
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('Credit Time Bank', () => {
    it('should credit hours to new time bank', async () => {
      const result = await creditTimeBankUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id.toString(),
        hours: 5,
        year: 2024,
      });

      expect(result.timeBank.balance).toBe(5);
    });

    it('should credit hours to existing time bank', async () => {
      await timeBankRepository.create({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id,
        balance: 10,
        year: 2024,
      });

      const result = await creditTimeBankUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id.toString(),
        hours: 5,
        year: 2024,
      });

      expect(result.timeBank.balance).toBe(15);
    });

    it('should throw error for invalid hours', async () => {
      await expect(
        creditTimeBankUseCase.execute({
          tenantId: TENANT_ID,
          employeeId: testEmployee.id.toString(),
          hours: -5,
          year: 2024,
        }),
      ).rejects.toThrow('Hours must be greater than 0');
    });
  });

  describe('Debit Time Bank', () => {
    it('should debit hours from time bank', async () => {
      await timeBankRepository.create({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id,
        balance: 10,
        year: 2024,
      });

      const result = await debitTimeBankUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id.toString(),
        hours: 3,
        year: 2024,
      });

      expect(result.timeBank.balance).toBe(7);
    });

    it('should allow negative balance', async () => {
      await timeBankRepository.create({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id,
        balance: 2,
        year: 2024,
      });

      const result = await debitTimeBankUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id.toString(),
        hours: 5,
        year: 2024,
      });

      expect(result.timeBank.balance).toBe(-3);
    });

    it('should throw error if time bank not found', async () => {
      await expect(
        debitTimeBankUseCase.execute({
          tenantId: TENANT_ID,
          employeeId: testEmployee.id.toString(),
          hours: 5,
          year: 2024,
        }),
      ).rejects.toThrow('Time bank not found for this employee and year');
    });

    it('should throw error for invalid hours', async () => {
      await timeBankRepository.create({
        tenantId: TENANT_ID,
        employeeId: testEmployee.id,
        balance: 10,
        year: 2024,
      });

      await expect(
        debitTimeBankUseCase.execute({
          tenantId: TENANT_ID,
          employeeId: testEmployee.id.toString(),
          hours: 0,
          year: 2024,
        }),
      ).rejects.toThrow('Hours must be greater than 0');
    });
  });
});

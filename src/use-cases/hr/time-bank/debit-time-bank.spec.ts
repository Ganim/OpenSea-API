import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTimeBankRepository } from '@/repositories/hr/in-memory/in-memory-time-bank-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DebitTimeBankUseCase } from './debit-time-bank';

let timeBankRepository: InMemoryTimeBankRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: DebitTimeBankUseCase;

describe('DebitTimeBankUseCase', () => {
  beforeEach(() => {
    timeBankRepository = new InMemoryTimeBankRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new DebitTimeBankUseCase(timeBankRepository, employeesRepository);
  });

  it('should throw Error for non-existent employee', async () => {
    await expect(() =>
      sut.execute({ employeeId: 'non-existent', hours: 5 }),
    ).rejects.toThrow('Employee not found');
  });

  it('should throw Error when hours is zero', async () => {
    await expect(() =>
      sut.execute({ employeeId: 'any', hours: 0 }),
    ).rejects.toThrow();
  });
});

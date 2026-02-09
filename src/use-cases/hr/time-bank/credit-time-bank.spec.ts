import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTimeBankRepository } from '@/repositories/hr/in-memory/in-memory-time-bank-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreditTimeBankUseCase } from './credit-time-bank';

let timeBankRepository: InMemoryTimeBankRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CreditTimeBankUseCase;

describe('CreditTimeBankUseCase', () => {
  beforeEach(() => {
    timeBankRepository = new InMemoryTimeBankRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CreditTimeBankUseCase(timeBankRepository, employeesRepository);
  });

  it('should throw Error for non-existent employee', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        employeeId: 'non-existent',
        hours: 5,
      }),
    ).rejects.toThrow('Employee not found');
  });

  it('should throw Error when hours is zero', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', employeeId: 'any', hours: 0 }),
    ).rejects.toThrow();
  });
});

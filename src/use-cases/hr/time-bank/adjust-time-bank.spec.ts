import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTimeBankRepository } from '@/repositories/hr/in-memory/in-memory-time-bank-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdjustTimeBankUseCase } from './adjust-time-bank';

let timeBankRepository: InMemoryTimeBankRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: AdjustTimeBankUseCase;

describe('AdjustTimeBankUseCase', () => {
  beforeEach(() => {
    timeBankRepository = new InMemoryTimeBankRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new AdjustTimeBankUseCase(timeBankRepository, employeesRepository);
  });

  it('should throw Error for non-existent employee', async () => {
    await expect(() =>
      sut.execute({ employeeId: 'non-existent', newBalance: 10 }),
    ).rejects.toThrow('Employee not found');
  });
});

import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTimeBankRepository } from '@/repositories/hr/in-memory/in-memory-time-bank-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTimeBankUseCase } from './get-time-bank';

let timeBankRepository: InMemoryTimeBankRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: GetTimeBankUseCase;

describe('GetTimeBankUseCase', () => {
  beforeEach(() => {
    timeBankRepository = new InMemoryTimeBankRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GetTimeBankUseCase(timeBankRepository, employeesRepository);
  });

  it('should throw Error for non-existent employee', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', employeeId: 'non-existent' }),
    ).rejects.toThrow('Employee not found');
  });
});

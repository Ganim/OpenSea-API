import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateVacationBalanceUseCase } from './calculate-vacation-balance';

let employeesRepository: InMemoryEmployeesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: CalculateVacationBalanceUseCase;

const tenantId = new UniqueEntityID().toString();

describe('CalculateVacationBalanceUseCase', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new CalculateVacationBalanceUseCase(
      employeesRepository,
      vacationPeriodsRepository,
    );
  });

  it('should throw ResourceNotFoundError for non-existent employee', async () => {
    await expect(() =>
      sut.execute({ tenantId, employeeId: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

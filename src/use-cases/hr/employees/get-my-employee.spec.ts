import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetMyEmployeeUseCase } from './get-my-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: GetMyEmployeeUseCase;
const tenantId = new UniqueEntityID().toString();

describe('GetMyEmployeeUseCase', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GetMyEmployeeUseCase(employeesRepository);
  });

  it('should throw ResourceNotFoundError when no employee record exists', async () => {
    await expect(() =>
      sut.execute({ tenantId, userId: 'unknown' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

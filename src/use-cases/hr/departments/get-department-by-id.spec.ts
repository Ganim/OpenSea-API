import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { InMemoryPositionsRepository } from '@/repositories/hr/in-memory/in-memory-positions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDepartmentUseCase } from './create-department';
import { GetDepartmentByIdUseCase } from './get-department-by-id';

let departmentsRepository: InMemoryDepartmentsRepository;
let companiesRepository: InMemoryCompaniesRepository;
let positionsRepository: InMemoryPositionsRepository;
let createDepartmentUseCase: CreateDepartmentUseCase;
let sut: GetDepartmentByIdUseCase;

const companyId = new UniqueEntityID().toString();

describe('Get Department By Id Use Case', () => {
  beforeEach(() => {
    departmentsRepository = new InMemoryDepartmentsRepository();
    companiesRepository = new InMemoryCompaniesRepository();
    positionsRepository = new InMemoryPositionsRepository();
    createDepartmentUseCase = new CreateDepartmentUseCase(
      departmentsRepository,
    );
    sut = new GetDepartmentByIdUseCase(
      departmentsRepository,
      companiesRepository,
      positionsRepository,
    );
  });

  it('should get department by id', async () => {
    const createResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
      description: 'Software Engineering Department',
      companyId,
    });

    const result = await sut.execute({
      id: createResult.department.id.toString(),
    });

    expect(result.department).toBeDefined();
    expect(result.department.id.toString()).toBe(
      createResult.department.id.toString(),
    );
    expect(result.department.name).toBe('Engineering');
    expect(result.department.code).toBe('ENG');
    expect(result.department.companyId.toString()).toBe(companyId);
  });

  it('should not get non-existent department', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
      }),
    ).rejects.toThrow('Department not found');
  });

  it('should not get deleted department', async () => {
    const createResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    await departmentsRepository.delete(createResult.department.id);

    await expect(
      sut.execute({
        id: createResult.department.id.toString(),
      }),
    ).rejects.toThrow('Department not found');
  });
});

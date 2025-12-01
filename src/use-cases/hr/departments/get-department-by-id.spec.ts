import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDepartmentUseCase } from './create-department';
import { GetDepartmentByIdUseCase } from './get-department-by-id';

let departmentsRepository: InMemoryDepartmentsRepository;
let createDepartmentUseCase: CreateDepartmentUseCase;
let sut: GetDepartmentByIdUseCase;

describe('Get Department By Id Use Case', () => {
  beforeEach(() => {
    departmentsRepository = new InMemoryDepartmentsRepository();
    createDepartmentUseCase = new CreateDepartmentUseCase(
      departmentsRepository,
    );
    sut = new GetDepartmentByIdUseCase(departmentsRepository);
  });

  it('should get department by id', async () => {
    const createResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
      description: 'Software Engineering Department',
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
    });

    await departmentsRepository.delete(createResult.department.id);

    await expect(
      sut.execute({
        id: createResult.department.id.toString(),
      }),
    ).rejects.toThrow('Department not found');
  });
});

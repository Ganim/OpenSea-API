import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDepartmentUseCase } from './create-department';

let departmentsRepository: InMemoryDepartmentsRepository;
let sut: CreateDepartmentUseCase;

describe('Create Department Use Case', () => {
  beforeEach(() => {
    departmentsRepository = new InMemoryDepartmentsRepository();
    sut = new CreateDepartmentUseCase(departmentsRepository);
  });

  it('should create a department successfully', async () => {
    const result = await sut.execute({
      name: 'Engineering',
      code: 'ENG',
      description: 'Software Engineering Department',
    });

    expect(result.department).toBeDefined();
    expect(result.department.name).toBe('Engineering');
    expect(result.department.code).toBe('ENG');
    expect(result.department.description).toBe(
      'Software Engineering Department',
    );
    expect(result.department.isActive).toBe(true);
  });

  it('should not create department with existing code', async () => {
    await sut.execute({
      name: 'Engineering',
      code: 'ENG',
    });

    await expect(
      sut.execute({
        name: 'Different Name',
        code: 'ENG',
      }),
    ).rejects.toThrow('Department with this code already exists');
  });

  it('should create department with parent', async () => {
    const parentResult = await sut.execute({
      name: 'Technology',
      code: 'TECH',
    });

    const childResult = await sut.execute({
      name: 'Engineering',
      code: 'ENG',
      parentId: parentResult.department.id.toString(),
    });

    expect(childResult.department.parentId?.toString()).toBe(
      parentResult.department.id.toString(),
    );
  });

  it('should not create department with non-existent parent', async () => {
    await expect(
      sut.execute({
        name: 'Engineering',
        code: 'ENG',
        parentId: 'non-existent-id',
      }),
    ).rejects.toThrow('Parent department not found');
  });

  it('should not create department under inactive parent', async () => {
    const parentResult = await sut.execute({
      name: 'Technology',
      code: 'TECH',
      isActive: false,
    });

    await expect(
      sut.execute({
        name: 'Engineering',
        code: 'ENG',
        parentId: parentResult.department.id.toString(),
      }),
    ).rejects.toThrow('Cannot create department under an inactive parent');
  });

  it('should create department with manager', async () => {
    const result = await sut.execute({
      name: 'Engineering',
      code: 'ENG',
      managerId: 'manager-123',
    });

    expect(result.department.managerId?.toString()).toBe('manager-123');
  });

  it('should create inactive department', async () => {
    const result = await sut.execute({
      name: 'Old Department',
      code: 'OLD',
      isActive: false,
    });

    expect(result.department.isActive).toBe(false);
  });
});

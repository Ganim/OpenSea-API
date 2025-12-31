import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDepartmentUseCase } from './create-department';

let departmentsRepository: InMemoryDepartmentsRepository;
let sut: CreateDepartmentUseCase;

const companyId = new UniqueEntityID().toString();
const anotherCompanyId = new UniqueEntityID().toString();

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
      companyId,
    });

    expect(result.department).toBeDefined();
    expect(result.department.name).toBe('Engineering');
    expect(result.department.code).toBe('ENG');
    expect(result.department.description).toBe(
      'Software Engineering Department',
    );
    expect(result.department.isActive).toBe(true);
    expect(result.department.companyId.toString()).toBe(companyId);
  });

  it('should not create department with existing code in the same company', async () => {
    await sut.execute({
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    await expect(
      sut.execute({
        name: 'Different Name',
        code: 'ENG',
        companyId,
      }),
    ).rejects.toThrow('Department with this code already exists');
  });

  it('should allow same code in different companies', async () => {
    await sut.execute({
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    const result = await sut.execute({
      name: 'Engineering',
      code: 'ENG',
      companyId: anotherCompanyId,
    });

    expect(result.department.code).toBe('ENG');
    expect(result.department.companyId.toString()).toBe(anotherCompanyId);
  });

  it('should create department with parent', async () => {
    const parentResult = await sut.execute({
      name: 'Technology',
      code: 'TECH',
      companyId,
    });

    const childResult = await sut.execute({
      name: 'Engineering',
      code: 'ENG',
      parentId: parentResult.department.id.toString(),
      companyId,
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
        companyId,
      }),
    ).rejects.toThrow('Parent department not found');
  });

  it('should not create department under inactive parent', async () => {
    const parentResult = await sut.execute({
      name: 'Technology',
      code: 'TECH',
      isActive: false,
      companyId,
    });

    await expect(
      sut.execute({
        name: 'Engineering',
        code: 'ENG',
        parentId: parentResult.department.id.toString(),
        companyId,
      }),
    ).rejects.toThrow('Cannot create department under an inactive parent');
  });

  it('should not create department with parent from different company', async () => {
    const parentResult = await sut.execute({
      name: 'Technology',
      code: 'TECH',
      companyId: anotherCompanyId,
    });

    await expect(
      sut.execute({
        name: 'Engineering',
        code: 'ENG',
        parentId: parentResult.department.id.toString(),
        companyId,
      }),
    ).rejects.toThrow('Parent department must belong to the same company');
  });

  it('should create department with manager', async () => {
    const result = await sut.execute({
      name: 'Engineering',
      code: 'ENG',
      managerId: 'manager-123',
      companyId,
    });

    expect(result.department.managerId?.toString()).toBe('manager-123');
  });

  it('should create inactive department', async () => {
    const result = await sut.execute({
      name: 'Old Department',
      code: 'OLD',
      isActive: false,
      companyId,
    });

    expect(result.department.isActive).toBe(false);
  });
});

import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDepartmentUseCase } from './create-department';
import { UpdateDepartmentUseCase } from './update-department';

let departmentsRepository: InMemoryDepartmentsRepository;
let createDepartmentUseCase: CreateDepartmentUseCase;
let sut: UpdateDepartmentUseCase;

describe('Update Department Use Case', () => {
  beforeEach(() => {
    departmentsRepository = new InMemoryDepartmentsRepository();
    createDepartmentUseCase = new CreateDepartmentUseCase(
      departmentsRepository,
    );
    sut = new UpdateDepartmentUseCase(departmentsRepository);
  });

  it('should update department successfully', async () => {
    const createResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
    });

    const result = await sut.execute({
      id: createResult.department.id.toString(),
      name: 'Software Engineering',
      description: 'Updated description',
    });

    expect(result.department.name).toBe('Software Engineering');
    expect(result.department.description).toBe('Updated description');
  });

  it('should not update non-existent department', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toThrow('Department not found');
  });

  it('should not update code to existing code', async () => {
    await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
    });

    const result2 = await createDepartmentUseCase.execute({
      name: 'Sales',
      code: 'SALES',
    });

    await expect(
      sut.execute({
        id: result2.department.id.toString(),
        code: 'ENG',
      }),
    ).rejects.toThrow('Department with this code already exists');
  });

  it('should update code if same department', async () => {
    const createResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
    });

    const result = await sut.execute({
      id: createResult.department.id.toString(),
      code: 'ENG', // Same code
      name: 'Updated Name',
    });

    expect(result.department.code).toBe('ENG');
    expect(result.department.name).toBe('Updated Name');
  });

  it('should not set department as its own parent', async () => {
    const createResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
    });

    await expect(
      sut.execute({
        id: createResult.department.id.toString(),
        parentId: createResult.department.id.toString(),
      }),
    ).rejects.toThrow('Department cannot be its own parent');
  });

  it('should not set non-existent parent', async () => {
    const createResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
    });

    await expect(
      sut.execute({
        id: createResult.department.id.toString(),
        parentId: 'non-existent-id',
      }),
    ).rejects.toThrow('Parent department not found');
  });

  it('should remove parent by setting null', async () => {
    const parentResult = await createDepartmentUseCase.execute({
      name: 'Technology',
      code: 'TECH',
    });

    const childResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
      parentId: parentResult.department.id.toString(),
    });

    const result = await sut.execute({
      id: childResult.department.id.toString(),
      parentId: null,
    });

    expect(result.department.parentId).toBeUndefined();
  });

  it('should update isActive status', async () => {
    const createResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
      isActive: true,
    });

    const result = await sut.execute({
      id: createResult.department.id.toString(),
      isActive: false,
    });

    expect(result.department.isActive).toBe(false);
  });

  it('should not set child as parent (circular reference)', async () => {
    const parentResult = await createDepartmentUseCase.execute({
      name: 'Technology',
      code: 'TECH',
    });

    const childResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
      parentId: parentResult.department.id.toString(),
    });

    await expect(
      sut.execute({
        id: parentResult.department.id.toString(),
        parentId: childResult.department.id.toString(),
      }),
    ).rejects.toThrow('Cannot set a child department as parent');
  });
});

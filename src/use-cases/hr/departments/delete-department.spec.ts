import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDepartmentUseCase } from './create-department';
import { DeleteDepartmentUseCase } from './delete-department';

let departmentsRepository: InMemoryDepartmentsRepository;
let createDepartmentUseCase: CreateDepartmentUseCase;
let sut: DeleteDepartmentUseCase;

const companyId = new UniqueEntityID().toString();

describe('Delete Department Use Case', () => {
  beforeEach(() => {
    departmentsRepository = new InMemoryDepartmentsRepository();
    createDepartmentUseCase = new CreateDepartmentUseCase(
      departmentsRepository,
    );
    sut = new DeleteDepartmentUseCase(departmentsRepository);
  });

  it('should delete department successfully', async () => {
    const createResult = await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    const result = await sut.execute({
      id: createResult.department.id.toString(),
    });

    expect(result.success).toBe(true);

    const deletedDepartment = await departmentsRepository.findById(
      createResult.department.id,
    );
    expect(deletedDepartment).toBeNull();
  });

  it('should not delete non-existent department', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
      }),
    ).rejects.toThrow('Department not found');
  });

  it('should not delete department with children', async () => {
    const parentResult = await createDepartmentUseCase.execute({
      name: 'Technology',
      code: 'TECH',
      companyId,
    });

    await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
      parentId: parentResult.department.id.toString(),
      companyId,
    });

    await expect(
      sut.execute({
        id: parentResult.department.id.toString(),
      }),
    ).rejects.toThrow('Cannot delete department with child departments');
  });
});

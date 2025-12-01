import { InMemoryPositionsRepository } from '@/repositories/hr/in-memory/in-memory-positions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePositionUseCase } from './create-position';
import { UpdatePositionUseCase } from './update-position';

let positionsRepository: InMemoryPositionsRepository;
let createPositionUseCase: CreatePositionUseCase;
let sut: UpdatePositionUseCase;

describe('Update Position Use Case', () => {
  beforeEach(() => {
    positionsRepository = new InMemoryPositionsRepository();
    createPositionUseCase = new CreatePositionUseCase(positionsRepository);
    sut = new UpdatePositionUseCase(positionsRepository);
  });

  it('should update position successfully', async () => {
    const createResult = await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
    });

    const result = await sut.execute({
      id: createResult.position.id.toString(),
      name: 'Senior Software Engineer',
      description: 'Updated description',
    });

    expect(result.position.name).toBe('Senior Software Engineer');
    expect(result.position.description).toBe('Updated description');
  });

  it('should not update non-existent position', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toThrow('Position not found');
  });

  it('should not update code to existing code', async () => {
    await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
    });

    const result2 = await createPositionUseCase.execute({
      name: 'Manager',
      code: 'MGR',
    });

    await expect(
      sut.execute({
        id: result2.position.id.toString(),
        code: 'SE',
      }),
    ).rejects.toThrow('Position with this code already exists');
  });

  it('should update code if same position', async () => {
    const createResult = await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
    });

    const result = await sut.execute({
      id: createResult.position.id.toString(),
      code: 'SE',
      name: 'Updated Name',
    });

    expect(result.position.code).toBe('SE');
    expect(result.position.name).toBe('Updated Name');
  });

  it('should not update with invalid salary range', async () => {
    const createResult = await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
      minSalary: 3000,
      maxSalary: 8000,
    });

    await expect(
      sut.execute({
        id: createResult.position.id.toString(),
        minSalary: 10000,
        maxSalary: 5000,
      }),
    ).rejects.toThrow('Minimum salary cannot be greater than maximum salary');
  });

  it('should update level', async () => {
    const createResult = await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
      level: 1,
    });

    const result = await sut.execute({
      id: createResult.position.id.toString(),
      level: 3,
    });

    expect(result.position.level).toBe(3);
  });

  it('should not update with invalid level', async () => {
    const createResult = await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
    });

    await expect(
      sut.execute({
        id: createResult.position.id.toString(),
        level: 0,
      }),
    ).rejects.toThrow('Position level must be at least 1');
  });

  it('should remove department by setting null', async () => {
    const createResult = await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
      departmentId: 'dept-123',
    });

    const result = await sut.execute({
      id: createResult.position.id.toString(),
      departmentId: null,
    });

    expect(result.position.departmentId).toBeUndefined();
  });

  it('should update isActive status', async () => {
    const createResult = await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
      isActive: true,
    });

    const result = await sut.execute({
      id: createResult.position.id.toString(),
      isActive: false,
    });

    expect(result.position.isActive).toBe(false);
  });
});

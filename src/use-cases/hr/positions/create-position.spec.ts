import { InMemoryPositionsRepository } from '@/repositories/hr/in-memory/in-memory-positions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePositionUseCase } from './create-position';

let positionsRepository: InMemoryPositionsRepository;
let sut: CreatePositionUseCase;

describe('Create Position Use Case', () => {
  beforeEach(() => {
    positionsRepository = new InMemoryPositionsRepository();
    sut = new CreatePositionUseCase(positionsRepository);
  });

  it('should create a position successfully', async () => {
    const result = await sut.execute({
      name: 'Software Engineer',
      code: 'SE',
      description: 'Develops software applications',
    });

    expect(result.position).toBeDefined();
    expect(result.position.name).toBe('Software Engineer');
    expect(result.position.code).toBe('SE');
    expect(result.position.description).toBe('Develops software applications');
    expect(result.position.isActive).toBe(true);
    expect(result.position.level).toBe(1);
  });

  it('should not create position with existing code', async () => {
    await sut.execute({
      name: 'Software Engineer',
      code: 'SE',
    });

    await expect(
      sut.execute({
        name: 'Different Name',
        code: 'SE',
      }),
    ).rejects.toThrow('Position with this code already exists');
  });

  it('should create position with salary range', async () => {
    const result = await sut.execute({
      name: 'Software Engineer',
      code: 'SE',
      minSalary: 3000,
      maxSalary: 8000,
    });

    expect(result.position.minSalary).toBe(3000);
    expect(result.position.maxSalary).toBe(8000);
  });

  it('should not create position with invalid salary range', async () => {
    await expect(
      sut.execute({
        name: 'Software Engineer',
        code: 'SE',
        minSalary: 8000,
        maxSalary: 3000,
      }),
    ).rejects.toThrow('Minimum salary cannot be greater than maximum salary');
  });

  it('should create position with department', async () => {
    const result = await sut.execute({
      name: 'Software Engineer',
      code: 'SE',
      departmentId: 'dept-123',
    });

    expect(result.position.departmentId?.toString()).toBe('dept-123');
  });

  it('should create position with level', async () => {
    const result = await sut.execute({
      name: 'Senior Software Engineer',
      code: 'SSE',
      level: 3,
    });

    expect(result.position.level).toBe(3);
  });

  it('should create inactive position', async () => {
    const result = await sut.execute({
      name: 'Old Position',
      code: 'OLD',
      isActive: false,
    });

    expect(result.position.isActive).toBe(false);
  });
});

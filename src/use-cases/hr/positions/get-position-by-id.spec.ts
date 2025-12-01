import { InMemoryPositionsRepository } from '@/repositories/hr/in-memory/in-memory-positions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePositionUseCase } from './create-position';
import { GetPositionByIdUseCase } from './get-position-by-id';

let positionsRepository: InMemoryPositionsRepository;
let createPositionUseCase: CreatePositionUseCase;
let sut: GetPositionByIdUseCase;

describe('Get Position By Id Use Case', () => {
  beforeEach(() => {
    positionsRepository = new InMemoryPositionsRepository();
    createPositionUseCase = new CreatePositionUseCase(positionsRepository);
    sut = new GetPositionByIdUseCase(positionsRepository);
  });

  it('should get position by id', async () => {
    const createResult = await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
      description: 'Develops software applications',
    });

    const result = await sut.execute({
      id: createResult.position.id.toString(),
    });

    expect(result.position).toBeDefined();
    expect(result.position.id.toString()).toBe(
      createResult.position.id.toString(),
    );
    expect(result.position.name).toBe('Software Engineer');
    expect(result.position.code).toBe('SE');
  });

  it('should not get non-existent position', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
      }),
    ).rejects.toThrow('Position not found');
  });

  it('should not get deleted position', async () => {
    const createResult = await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
    });

    await positionsRepository.delete(createResult.position.id);

    await expect(
      sut.execute({
        id: createResult.position.id.toString(),
      }),
    ).rejects.toThrow('Position not found');
  });
});

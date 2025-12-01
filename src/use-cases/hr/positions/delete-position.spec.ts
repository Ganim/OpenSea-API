import { InMemoryPositionsRepository } from '@/repositories/hr/in-memory/in-memory-positions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePositionUseCase } from './create-position';
import { DeletePositionUseCase } from './delete-position';

let positionsRepository: InMemoryPositionsRepository;
let createPositionUseCase: CreatePositionUseCase;
let sut: DeletePositionUseCase;

describe('Delete Position Use Case', () => {
  beforeEach(() => {
    positionsRepository = new InMemoryPositionsRepository();
    createPositionUseCase = new CreatePositionUseCase(positionsRepository);
    sut = new DeletePositionUseCase(positionsRepository);
  });

  it('should delete position successfully', async () => {
    const createResult = await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
    });

    const result = await sut.execute({
      id: createResult.position.id.toString(),
    });

    expect(result.success).toBe(true);

    const deletedPosition = await positionsRepository.findById(
      createResult.position.id,
    );
    expect(deletedPosition).toBeNull();
  });

  it('should not delete non-existent position', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
      }),
    ).rejects.toThrow('Position not found');
  });
});

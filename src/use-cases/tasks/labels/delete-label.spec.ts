import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteLabelUseCase } from './delete-label';
import { InMemoryBoardLabelsRepository } from '@/repositories/tasks/in-memory/in-memory-board-labels-repository';

let boardLabelsRepository: InMemoryBoardLabelsRepository;
let sut: DeleteLabelUseCase;

describe('DeleteLabelUseCase', () => {
  let boardId: string;
  let labelId: string;

  beforeEach(async () => {
    boardLabelsRepository = new InMemoryBoardLabelsRepository();
    sut = new DeleteLabelUseCase(boardLabelsRepository);

    boardId = 'board-1';

    const label = await boardLabelsRepository.create({
      boardId,
      name: 'Bug',
      color: '#FF0000',
      position: 0,
    });

    labelId = label.id;
  });

  it('should delete a label', async () => {
    await sut.execute({ boardId, labelId });

    expect(boardLabelsRepository.items).toHaveLength(0);
  });

  it('should reject if label is not found', async () => {
    await expect(
      sut.execute({ boardId, labelId: 'nonexistent-label' }),
    ).rejects.toThrow('Label not found');
  });
});

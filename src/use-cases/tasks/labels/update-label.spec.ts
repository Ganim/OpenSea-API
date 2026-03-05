import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateLabelUseCase } from './update-label';
import { InMemoryBoardLabelsRepository } from '@/repositories/tasks/in-memory/in-memory-board-labels-repository';

let boardLabelsRepository: InMemoryBoardLabelsRepository;
let sut: UpdateLabelUseCase;

describe('UpdateLabelUseCase', () => {
  let boardId: string;
  let labelId: string;

  beforeEach(async () => {
    boardLabelsRepository = new InMemoryBoardLabelsRepository();
    sut = new UpdateLabelUseCase(boardLabelsRepository);

    boardId = 'board-1';

    const label = await boardLabelsRepository.create({
      boardId,
      name: 'Bug',
      color: '#FF0000',
      position: 0,
    });

    labelId = label.id;
  });

  it('should update a label name', async () => {
    const { label } = await sut.execute({
      boardId,
      labelId,
      name: 'Critical Bug',
    });

    expect(label.name).toBe('Critical Bug');
    expect(label.color).toBe('#FF0000');
  });

  it('should update a label color', async () => {
    const { label } = await sut.execute({
      boardId,
      labelId,
      color: '#00FF00',
    });

    expect(label.color).toBe('#00FF00');
    expect(label.name).toBe('Bug');
  });

  it('should update both name and color', async () => {
    const { label } = await sut.execute({
      boardId,
      labelId,
      name: 'Feature',
      color: '#0000FF',
    });

    expect(label.name).toBe('Feature');
    expect(label.color).toBe('#0000FF');
  });

  it('should reject if label is not found', async () => {
    await expect(
      sut.execute({
        boardId,
        labelId: 'nonexistent-label',
        name: 'New Name',
      }),
    ).rejects.toThrow('Label not found');
  });
});

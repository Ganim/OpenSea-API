import { describe, it, expect, beforeEach } from 'vitest';
import { ListCustomFieldsUseCase } from './list-custom-fields';
import { InMemoryBoardCustomFieldsRepository } from '@/repositories/tasks/in-memory/in-memory-board-custom-fields-repository';

let boardCustomFieldsRepository: InMemoryBoardCustomFieldsRepository;
let sut: ListCustomFieldsUseCase;

describe('ListCustomFieldsUseCase', () => {
  beforeEach(() => {
    boardCustomFieldsRepository = new InMemoryBoardCustomFieldsRepository();
    sut = new ListCustomFieldsUseCase(boardCustomFieldsRepository);
  });

  it('should list custom fields for a board', async () => {
    await boardCustomFieldsRepository.create({
      boardId: 'board-1',
      name: 'Text Field',
      type: 'TEXT',
      position: 0,
    });

    await boardCustomFieldsRepository.create({
      boardId: 'board-1',
      name: 'Number Field',
      type: 'NUMBER',
      position: 1,
    });

    await boardCustomFieldsRepository.create({
      boardId: 'board-2',
      name: 'Other Board Field',
      type: 'TEXT',
      position: 0,
    });

    const { customFields } = await sut.execute({ boardId: 'board-1' });

    expect(customFields).toHaveLength(2);
    expect(customFields[0].name).toBe('Text Field');
    expect(customFields[1].name).toBe('Number Field');
  });

  it('should return empty array when board has no custom fields', async () => {
    const { customFields } = await sut.execute({ boardId: 'board-1' });

    expect(customFields).toHaveLength(0);
  });

  it('should return fields sorted by position', async () => {
    await boardCustomFieldsRepository.create({
      boardId: 'board-1',
      name: 'Second',
      type: 'TEXT',
      position: 1,
    });

    await boardCustomFieldsRepository.create({
      boardId: 'board-1',
      name: 'First',
      type: 'TEXT',
      position: 0,
    });

    const { customFields } = await sut.execute({ boardId: 'board-1' });

    expect(customFields[0].name).toBe('First');
    expect(customFields[1].name).toBe('Second');
  });
});

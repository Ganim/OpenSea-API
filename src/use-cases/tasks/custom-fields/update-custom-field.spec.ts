import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCustomFieldUseCase } from './update-custom-field';
import { InMemoryBoardCustomFieldsRepository } from '@/repositories/tasks/in-memory/in-memory-board-custom-fields-repository';

let boardCustomFieldsRepository: InMemoryBoardCustomFieldsRepository;
let sut: UpdateCustomFieldUseCase;

describe('UpdateCustomFieldUseCase', () => {
  let boardId: string;
  let fieldId: string;

  beforeEach(async () => {
    boardCustomFieldsRepository = new InMemoryBoardCustomFieldsRepository();
    sut = new UpdateCustomFieldUseCase(boardCustomFieldsRepository);

    boardId = 'board-1';

    const field = await boardCustomFieldsRepository.create({
      boardId,
      name: 'Original Name',
      type: 'TEXT',
      position: 0,
    });

    fieldId = field.id;
  });

  it('should update a custom field name', async () => {
    const { customField } = await sut.execute({
      boardId,
      fieldId,
      name: 'Updated Name',
    });

    expect(customField.name).toBe('Updated Name');
  });

  it('should update custom field options', async () => {
    const selectField = await boardCustomFieldsRepository.create({
      boardId,
      name: 'Select Field',
      type: 'SELECT',
      options: { choices: ['A', 'B'] },
      position: 1,
    });

    const { customField } = await sut.execute({
      boardId,
      fieldId: selectField.id,
      options: { choices: ['A', 'B', 'C'] },
    });

    expect(customField.options).toEqual({ choices: ['A', 'B', 'C'] });
  });

  it('should update isRequired flag', async () => {
    const { customField } = await sut.execute({
      boardId,
      fieldId,
      isRequired: true,
    });

    expect(customField.isRequired).toBe(true);
  });

  it('should reject if custom field is not found', async () => {
    await expect(
      sut.execute({
        boardId,
        fieldId: 'nonexistent-field',
        name: 'New Name',
      }),
    ).rejects.toThrow('Custom field not found');
  });
});

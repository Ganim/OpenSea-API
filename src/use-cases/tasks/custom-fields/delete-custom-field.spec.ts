import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteCustomFieldUseCase } from './delete-custom-field';
import { InMemoryBoardCustomFieldsRepository } from '@/repositories/tasks/in-memory/in-memory-board-custom-fields-repository';
import { InMemoryCardCustomFieldValuesRepository } from '@/repositories/tasks/in-memory/in-memory-card-custom-field-values-repository';

let boardCustomFieldsRepository: InMemoryBoardCustomFieldsRepository;
let cardCustomFieldValuesRepository: InMemoryCardCustomFieldValuesRepository;
let sut: DeleteCustomFieldUseCase;

describe('DeleteCustomFieldUseCase', () => {
  let boardId: string;
  let fieldId: string;

  beforeEach(async () => {
    boardCustomFieldsRepository = new InMemoryBoardCustomFieldsRepository();
    cardCustomFieldValuesRepository =
      new InMemoryCardCustomFieldValuesRepository();
    sut = new DeleteCustomFieldUseCase(
      boardCustomFieldsRepository,
      cardCustomFieldValuesRepository,
    );

    boardId = 'board-1';

    const field = await boardCustomFieldsRepository.create({
      boardId,
      name: 'Field to Delete',
      type: 'TEXT',
      position: 0,
    });

    fieldId = field.id;
  });

  it('should delete a custom field', async () => {
    await sut.execute({ boardId, fieldId });

    expect(boardCustomFieldsRepository.items).toHaveLength(0);
  });

  it('should also delete all card custom field values for the field', async () => {
    await cardCustomFieldValuesRepository.setValues('card-1', [
      { cardId: 'card-1', fieldId, value: 'some value' },
    ]);
    await cardCustomFieldValuesRepository.setValues('card-2', [
      { cardId: 'card-2', fieldId, value: 'another value' },
    ]);

    expect(cardCustomFieldValuesRepository.items).toHaveLength(2);

    await sut.execute({ boardId, fieldId });

    expect(cardCustomFieldValuesRepository.items).toHaveLength(0);
    expect(boardCustomFieldsRepository.items).toHaveLength(0);
  });

  it('should reject if custom field is not found', async () => {
    await expect(
      sut.execute({ boardId, fieldId: 'nonexistent-field' }),
    ).rejects.toThrow('Custom field not found');
  });
});

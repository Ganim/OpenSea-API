import { describe, it, expect, beforeEach } from 'vitest';
import { SetCardCustomFieldValuesUseCase } from './set-card-custom-field-values';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryBoardCustomFieldsRepository } from '@/repositories/tasks/in-memory/in-memory-board-custom-fields-repository';
import { InMemoryCardCustomFieldValuesRepository } from '@/repositories/tasks/in-memory/in-memory-card-custom-field-values-repository';

let cardsRepository: InMemoryCardsRepository;
let boardCustomFieldsRepository: InMemoryBoardCustomFieldsRepository;
let cardCustomFieldValuesRepository: InMemoryCardCustomFieldValuesRepository;
let sut: SetCardCustomFieldValuesUseCase;

describe('SetCardCustomFieldValuesUseCase', () => {
  let boardId: string;
  let cardId: string;
  let textFieldId: string;
  let selectFieldId: string;
  let requiredFieldId: string;

  beforeEach(async () => {
    cardsRepository = new InMemoryCardsRepository();
    boardCustomFieldsRepository = new InMemoryBoardCustomFieldsRepository();
    cardCustomFieldValuesRepository =
      new InMemoryCardCustomFieldValuesRepository();
    sut = new SetCardCustomFieldValuesUseCase(
      cardsRepository,
      boardCustomFieldsRepository,
      cardCustomFieldValuesRepository,
    );

    boardId = 'board-1';

    const card = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
      position: 0,
    });

    cardId = card.id.toString();

    const textField = await boardCustomFieldsRepository.create({
      boardId,
      name: 'Notes',
      type: 'TEXT',
      position: 0,
    });

    textFieldId = textField.id;

    const selectField = await boardCustomFieldsRepository.create({
      boardId,
      name: 'Category',
      type: 'SELECT',
      options: { choices: ['Bug', 'Feature', 'Improvement'] },
      position: 1,
    });

    selectFieldId = selectField.id;

    const requiredField = await boardCustomFieldsRepository.create({
      boardId,
      name: 'Required Notes',
      type: 'TEXT',
      position: 2,
      isRequired: true,
    });

    requiredFieldId = requiredField.id;
  });

  it('should set a text field value', async () => {
    const { fieldValues } = await sut.execute({
      boardId,
      cardId,
      values: [
        { fieldId: textFieldId, value: 'Some notes' },
        { fieldId: requiredFieldId, value: 'Required value' },
      ],
    });

    expect(fieldValues).toHaveLength(2);

    const textValue = fieldValues.find((fv) => fv.fieldId === textFieldId);
    expect(textValue?.value).toBe('Some notes');
  });

  it('should set a select field with a valid option', async () => {
    const { fieldValues } = await sut.execute({
      boardId,
      cardId,
      values: [
        { fieldId: selectFieldId, value: 'Bug' },
        { fieldId: requiredFieldId, value: 'Required value' },
      ],
    });

    const selectValue = fieldValues.find((fv) => fv.fieldId === selectFieldId);
    expect(selectValue?.value).toBe('Bug');
  });

  it('should reject an invalid select option', async () => {
    await expect(
      sut.execute({
        boardId,
        cardId,
        values: [
          { fieldId: selectFieldId, value: 'InvalidOption' },
          { fieldId: requiredFieldId, value: 'Required value' },
        ],
      }),
    ).rejects.toThrow(
      'Value "InvalidOption" is not a valid option for field "Category"',
    );
  });

  it('should reject when required field is missing', async () => {
    await expect(
      sut.execute({
        boardId,
        cardId,
        values: [{ fieldId: textFieldId, value: 'Only text' }],
      }),
    ).rejects.toThrow('Field "Required Notes" is required');
  });

  it('should reject when required field value is null', async () => {
    await expect(
      sut.execute({
        boardId,
        cardId,
        values: [
          { fieldId: textFieldId, value: 'Some text' },
          { fieldId: requiredFieldId, value: null },
        ],
      }),
    ).rejects.toThrow('Field "Required Notes" is required and cannot be empty');
  });

  it('should reject if field does not exist', async () => {
    await expect(
      sut.execute({
        boardId,
        cardId,
        values: [
          { fieldId: 'nonexistent-field', value: 'test' },
          { fieldId: requiredFieldId, value: 'Required value' },
        ],
      }),
    ).rejects.toThrow('Custom field nonexistent-field not found');
  });

  it('should reject if card does not exist', async () => {
    await expect(
      sut.execute({
        boardId,
        cardId: 'nonexistent-card',
        values: [{ fieldId: textFieldId, value: 'test' }],
      }),
    ).rejects.toThrow('Card not found');
  });

  it('should reject wrong type for number field', async () => {
    const numberField = await boardCustomFieldsRepository.create({
      boardId,
      name: 'Estimate',
      type: 'NUMBER',
      position: 3,
    });

    await expect(
      sut.execute({
        boardId,
        cardId,
        values: [
          { fieldId: numberField.id, value: 'not a number' },
          { fieldId: requiredFieldId, value: 'Required value' },
        ],
      }),
    ).rejects.toThrow('Field "Estimate" expects a numeric value');
  });

  it('should reject wrong type for checkbox field', async () => {
    const checkboxField = await boardCustomFieldsRepository.create({
      boardId,
      name: 'Done',
      type: 'CHECKBOX',
      position: 3,
    });

    await expect(
      sut.execute({
        boardId,
        cardId,
        values: [
          { fieldId: checkboxField.id, value: 'yes' },
          { fieldId: requiredFieldId, value: 'Required value' },
        ],
      }),
    ).rejects.toThrow('Field "Done" expects a boolean value');
  });

  it('should validate multi-select values against options', async () => {
    const multiSelectField = await boardCustomFieldsRepository.create({
      boardId,
      name: 'Tags',
      type: 'MULTI_SELECT',
      options: { choices: ['Frontend', 'Backend', 'DevOps'] },
      position: 3,
    });

    await expect(
      sut.execute({
        boardId,
        cardId,
        values: [
          { fieldId: multiSelectField.id, value: ['Frontend', 'Unknown'] },
          { fieldId: requiredFieldId, value: 'Required value' },
        ],
      }),
    ).rejects.toThrow('Value "Unknown" is not a valid option for field "Tags"');
  });

  it('should accept valid multi-select values', async () => {
    const multiSelectField = await boardCustomFieldsRepository.create({
      boardId,
      name: 'Tags',
      type: 'MULTI_SELECT',
      options: { choices: ['Frontend', 'Backend', 'DevOps'] },
      position: 3,
    });

    const { fieldValues } = await sut.execute({
      boardId,
      cardId,
      values: [
        { fieldId: multiSelectField.id, value: ['Frontend', 'Backend'] },
        { fieldId: requiredFieldId, value: 'Required value' },
      ],
    });

    const multiValue = fieldValues.find(
      (fv) => fv.fieldId === multiSelectField.id,
    );
    expect(multiValue?.value).toEqual(['Frontend', 'Backend']);
  });
});

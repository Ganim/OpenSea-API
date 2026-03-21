import { describe, it, expect, beforeEach } from 'vitest';
import { SetCardCustomFieldValuesUseCase } from './set-card-custom-field-values';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryBoardCustomFieldsRepository } from '@/repositories/tasks/in-memory/in-memory-board-custom-fields-repository';
import { InMemoryCardCustomFieldValuesRepository } from '@/repositories/tasks/in-memory/in-memory-card-custom-field-values-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardsRepository: InMemoryCardsRepository;
let boardCustomFieldsRepository: InMemoryBoardCustomFieldsRepository;
let cardCustomFieldValuesRepository: InMemoryCardCustomFieldValuesRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
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
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new SetCardCustomFieldValuesUseCase(
      cardsRepository,
      boardCustomFieldsRepository,
      cardCustomFieldValuesRepository,
      cardActivitiesRepository,
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
      userId: 'user-1',
      userName: 'User 1',
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
      userId: 'user-1',
      userName: 'User 1',
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
        userId: 'user-1',
        userName: 'User 1',
        values: [
          { fieldId: selectFieldId, value: 'InvalidOption' },
          { fieldId: requiredFieldId, value: 'Required value' },
        ],
      }),
    ).rejects.toThrow(
      'O valor "InvalidOption" não é uma opção válida para o campo "Category"',
    );
  });

  it('should reject when required field is missing', async () => {
    await expect(
      sut.execute({
        boardId,
        cardId,
        userId: 'user-1',
        userName: 'User 1',
        values: [{ fieldId: textFieldId, value: 'Only text' }],
      }),
    ).rejects.toThrow('O campo "Required Notes" é obrigatório');
  });

  it('should reject when required field value is null', async () => {
    await expect(
      sut.execute({
        boardId,
        cardId,
        userId: 'user-1',
        userName: 'User 1',
        values: [
          { fieldId: textFieldId, value: 'Some text' },
          { fieldId: requiredFieldId, value: null },
        ],
      }),
    ).rejects.toThrow('O campo "Required Notes" é obrigatório e não pode estar vazio');
  });

  it('should reject if field does not exist', async () => {
    await expect(
      sut.execute({
        boardId,
        cardId,
        userId: 'user-1',
        userName: 'User 1',
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
        userId: 'user-1',
        userName: 'User 1',
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
        userId: 'user-1',
        userName: 'User 1',
        values: [
          { fieldId: numberField.id, value: 'not a number' },
          { fieldId: requiredFieldId, value: 'Required value' },
        ],
      }),
    ).rejects.toThrow('O campo "Estimate" espera um valor numérico');
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
        userId: 'user-1',
        userName: 'User 1',
        values: [
          { fieldId: checkboxField.id, value: 'yes' },
          { fieldId: requiredFieldId, value: 'Required value' },
        ],
      }),
    ).rejects.toThrow('O campo "Done" espera um valor booleano (verdadeiro ou falso)');
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
        userId: 'user-1',
        userName: 'User 1',
        values: [
          { fieldId: multiSelectField.id, value: ['Frontend', 'Unknown'] },
          { fieldId: requiredFieldId, value: 'Required value' },
        ],
      }),
    ).rejects.toThrow('O valor "Unknown" não é uma opção válida para o campo "Tags"');
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
      userId: 'user-1',
      userName: 'User 1',
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

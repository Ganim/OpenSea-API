import { describe, it, expect, beforeEach } from 'vitest';
import { CreateCustomFieldUseCase } from './create-custom-field';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardCustomFieldsRepository } from '@/repositories/tasks/in-memory/in-memory-board-custom-fields-repository';

let boardsRepository: InMemoryBoardsRepository;
let boardCustomFieldsRepository: InMemoryBoardCustomFieldsRepository;
let sut: CreateCustomFieldUseCase;

describe('CreateCustomFieldUseCase', () => {
  let boardId: string;

  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    boardCustomFieldsRepository = new InMemoryBoardCustomFieldsRepository();
    sut = new CreateCustomFieldUseCase(
      boardsRepository,
      boardCustomFieldsRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });

    boardId = boardsRepository.items[0].id.toString();
  });

  it('should create a TEXT custom field', async () => {
    const { customField } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      name: 'Description Field',
      type: 'TEXT',
    });

    expect(customField.name).toBe('Description Field');
    expect(customField.type).toBe('TEXT');
    expect(customField.isRequired).toBe(false);
    expect(customField.position).toBe(0);
    expect(boardCustomFieldsRepository.items).toHaveLength(1);
  });

  it('should create a SELECT custom field with options', async () => {
    const { customField } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      name: 'Priority Level',
      type: 'SELECT',
      options: { choices: ['Low', 'Medium', 'High'] },
    });

    expect(customField.name).toBe('Priority Level');
    expect(customField.type).toBe('SELECT');
    expect(customField.options).toEqual({ choices: ['Low', 'Medium', 'High'] });
  });

  it('should reject SELECT type without options', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId,
        name: 'Status',
        type: 'SELECT',
      }),
    ).rejects.toThrow(
      'Custom field type SELECT requires at least one option in choices',
    );
  });

  it('should reject MULTI_SELECT type without options', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId,
        name: 'Tags',
        type: 'MULTI_SELECT',
        options: { choices: [] },
      }),
    ).rejects.toThrow(
      'Custom field type MULTI_SELECT requires at least one option in choices',
    );
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId: 'nonexistent-board',
        name: 'Field',
        type: 'TEXT',
      }),
    ).rejects.toThrow('Board not found');
  });

  it('should reject empty name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId,
        name: '',
        type: 'TEXT',
      }),
    ).rejects.toThrow('Custom field name is required');
  });

  it('should auto-calculate position based on existing fields', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      name: 'First Field',
      type: 'TEXT',
    });

    const { customField: secondField } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      name: 'Second Field',
      type: 'NUMBER',
    });

    expect(secondField.position).toBe(1);
  });

  it('should create a required custom field', async () => {
    const { customField } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      name: 'Required Field',
      type: 'TEXT',
      isRequired: true,
    });

    expect(customField.isRequired).toBe(true);
  });
});

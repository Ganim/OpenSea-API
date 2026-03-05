import { describe, it, expect, beforeEach } from 'vitest';
import { CreateAutomationUseCase } from './create-automation';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardAutomationsRepository } from '@/repositories/tasks/in-memory/in-memory-board-automations-repository';

let boardsRepository: InMemoryBoardsRepository;
let boardAutomationsRepository: InMemoryBoardAutomationsRepository;
let sut: CreateAutomationUseCase;

describe('CreateAutomationUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    boardAutomationsRepository = new InMemoryBoardAutomationsRepository();
    sut = new CreateAutomationUseCase(
      boardsRepository,
      boardAutomationsRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Sprint Board',
      ownerId: 'user-1',
    });
  });

  it('should create an automation with valid trigger and action', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const { automation } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      name: 'Auto-complete on Done column',
      trigger: 'CARD_MOVED',
      triggerConfig: { toColumnId: 'done-col' },
      action: 'COMPLETE_CARD',
      actionConfig: {},
    });

    expect(automation.name).toBe('Auto-complete on Done column');
    expect(automation.trigger).toBe('CARD_MOVED');
    expect(automation.action).toBe('COMPLETE_CARD');
    expect(automation.isActive).toBe(true);
    expect(automation.createdBy).toBe('user-1');
    expect(boardAutomationsRepository.items).toHaveLength(1);
  });

  it('should reject if board is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'nonexistent-board',
        name: 'Some automation',
        trigger: 'CARD_MOVED',
        triggerConfig: {},
        action: 'COMPLETE_CARD',
        actionConfig: {},
      }),
    ).rejects.toThrow('Board not found');
  });

  it('should reject an invalid trigger', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        name: 'Bad trigger',
        trigger: 'INVALID_TRIGGER',
        triggerConfig: {},
        action: 'COMPLETE_CARD',
        actionConfig: {},
      }),
    ).rejects.toThrow('Invalid trigger');
  });

  it('should reject an invalid action', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        name: 'Bad action',
        trigger: 'CARD_MOVED',
        triggerConfig: {},
        action: 'INVALID_ACTION',
        actionConfig: {},
      }),
    ).rejects.toThrow('Invalid action');
  });
});

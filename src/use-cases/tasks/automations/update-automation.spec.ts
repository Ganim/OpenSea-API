import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateAutomationUseCase } from './update-automation';
import { InMemoryBoardAutomationsRepository } from '@/repositories/tasks/in-memory/in-memory-board-automations-repository';

let boardAutomationsRepository: InMemoryBoardAutomationsRepository;
let sut: UpdateAutomationUseCase;

describe('UpdateAutomationUseCase', () => {
  beforeEach(async () => {
    boardAutomationsRepository = new InMemoryBoardAutomationsRepository();
    sut = new UpdateAutomationUseCase(boardAutomationsRepository);

    await boardAutomationsRepository.create({
      boardId: 'board-1',
      name: 'Original Automation',
      trigger: 'CARD_MOVED',
      triggerConfig: { toColumnId: 'done-col' },
      action: 'COMPLETE_CARD',
      actionConfig: {},
      createdBy: 'user-1',
    });
  });

  it('should update automation fields', async () => {
    const automationId = boardAutomationsRepository.items[0].id;

    const { automation } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      automationId,
      name: 'Updated Automation',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'ASSIGN_USER',
      actionConfig: { userId: 'user-2' },
    });

    expect(automation.name).toBe('Updated Automation');
    expect(automation.trigger).toBe('CARD_CREATED');
    expect(automation.action).toBe('ASSIGN_USER');
    expect(automation.actionConfig).toEqual({ userId: 'user-2' });
  });

  it('should throw if automation is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'board-1',
        automationId: 'nonexistent-id',
        name: 'Updated',
      }),
    ).rejects.toThrow('Automation not found');
  });
});

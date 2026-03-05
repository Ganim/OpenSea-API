import { describe, it, expect, beforeEach } from 'vitest';
import { ToggleAutomationUseCase } from './toggle-automation';
import { InMemoryBoardAutomationsRepository } from '@/repositories/tasks/in-memory/in-memory-board-automations-repository';

let boardAutomationsRepository: InMemoryBoardAutomationsRepository;
let sut: ToggleAutomationUseCase;

describe('ToggleAutomationUseCase', () => {
  beforeEach(async () => {
    boardAutomationsRepository = new InMemoryBoardAutomationsRepository();
    sut = new ToggleAutomationUseCase(boardAutomationsRepository);

    await boardAutomationsRepository.create({
      boardId: 'board-1',
      name: 'Auto-complete',
      isActive: true,
      trigger: 'CARD_MOVED',
      triggerConfig: {},
      action: 'COMPLETE_CARD',
      actionConfig: {},
      createdBy: 'user-1',
    });
  });

  it('should deactivate an active automation', async () => {
    const automationId = boardAutomationsRepository.items[0].id;

    const { automation } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      automationId,
      isActive: false,
    });

    expect(automation.isActive).toBe(false);
  });

  it('should activate an inactive automation', async () => {
    const automationId = boardAutomationsRepository.items[0].id;

    // First deactivate
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      automationId,
      isActive: false,
    });

    // Then reactivate
    const { automation } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      automationId,
      isActive: true,
    });

    expect(automation.isActive).toBe(true);
  });

  it('should throw if automation is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'board-1',
        automationId: 'nonexistent-id',
        isActive: false,
      }),
    ).rejects.toThrow('Automation not found');
  });
});

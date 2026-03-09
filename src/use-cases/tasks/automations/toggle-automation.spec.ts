import { describe, it, expect, beforeEach } from 'vitest';
import { ToggleAutomationUseCase } from './toggle-automation';
import { InMemoryBoardAutomationsRepository } from '@/repositories/tasks/in-memory/in-memory-board-automations-repository';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';

let boardAutomationsRepository: InMemoryBoardAutomationsRepository;
let boardsRepository: InMemoryBoardsRepository;
let sut: ToggleAutomationUseCase;
let boardId: string;

describe('ToggleAutomationUseCase', () => {
  beforeEach(async () => {
    boardAutomationsRepository = new InMemoryBoardAutomationsRepository();
    boardsRepository = new InMemoryBoardsRepository();
    sut = new ToggleAutomationUseCase(
      boardAutomationsRepository,
      boardsRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });

    boardId = boardsRepository.items[0].id.toString();

    await boardAutomationsRepository.create({
      boardId,
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
      boardId,
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
      boardId,
      automationId,
      isActive: false,
    });

    // Then reactivate
    const { automation } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
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
        boardId,
        automationId: 'nonexistent-id',
        isActive: false,
      }),
    ).rejects.toThrow('Automation not found');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteAutomationUseCase } from './delete-automation';
import { InMemoryBoardAutomationsRepository } from '@/repositories/tasks/in-memory/in-memory-board-automations-repository';

let boardAutomationsRepository: InMemoryBoardAutomationsRepository;
let sut: DeleteAutomationUseCase;

describe('DeleteAutomationUseCase', () => {
  beforeEach(async () => {
    boardAutomationsRepository = new InMemoryBoardAutomationsRepository();
    sut = new DeleteAutomationUseCase(boardAutomationsRepository);

    await boardAutomationsRepository.create({
      boardId: 'board-1',
      name: 'Auto-complete',
      trigger: 'CARD_MOVED',
      triggerConfig: {},
      action: 'COMPLETE_CARD',
      actionConfig: {},
      createdBy: 'user-1',
    });
  });

  it('should delete an existing automation', async () => {
    const automationId = boardAutomationsRepository.items[0].id;

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      automationId,
    });

    expect(boardAutomationsRepository.items).toHaveLength(0);
  });

  it('should throw if automation is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'board-1',
        automationId: 'nonexistent-id',
      }),
    ).rejects.toThrow('Automation not found');
  });
});

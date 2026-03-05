import { describe, it, expect, beforeEach } from 'vitest';
import { ListAutomationsUseCase } from './list-automations';
import { InMemoryBoardAutomationsRepository } from '@/repositories/tasks/in-memory/in-memory-board-automations-repository';

let boardAutomationsRepository: InMemoryBoardAutomationsRepository;
let sut: ListAutomationsUseCase;

describe('ListAutomationsUseCase', () => {
  beforeEach(() => {
    boardAutomationsRepository = new InMemoryBoardAutomationsRepository();
    sut = new ListAutomationsUseCase(boardAutomationsRepository);
  });

  it('should list all automations for a board', async () => {
    await boardAutomationsRepository.create({
      boardId: 'board-1',
      name: 'Automation A',
      trigger: 'CARD_MOVED',
      triggerConfig: {},
      action: 'COMPLETE_CARD',
      actionConfig: {},
      createdBy: 'user-1',
    });

    await boardAutomationsRepository.create({
      boardId: 'board-1',
      name: 'Automation B',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'ASSIGN_USER',
      actionConfig: { userId: 'user-2' },
      createdBy: 'user-1',
    });

    await boardAutomationsRepository.create({
      boardId: 'board-2',
      name: 'Other Board Automation',
      trigger: 'CARD_MOVED',
      triggerConfig: {},
      action: 'MOVE_CARD',
      actionConfig: {},
      createdBy: 'user-1',
    });

    const { automations } = await sut.execute({
      tenantId: 'tenant-1',
      boardId: 'board-1',
    });

    expect(automations).toHaveLength(2);
    expect(automations[0].name).toBe('Automation A');
    expect(automations[1].name).toBe('Automation B');
  });

  it('should return empty array when no automations exist', async () => {
    const { automations } = await sut.execute({
      tenantId: 'tenant-1',
      boardId: 'board-1',
    });

    expect(automations).toHaveLength(0);
  });
});

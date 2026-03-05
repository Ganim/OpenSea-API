import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { TaskSyncService } from './task-sync-service';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryBoardColumnsRepository } from '@/repositories/tasks/in-memory/in-memory-board-columns-repository';

let cardsRepo: InMemoryCardsRepository;
let columnsRepo: InMemoryBoardColumnsRepository;
let sut: TaskSyncService;

let defaultColumnId: string;
let doneColumnId: string;

describe('TaskSyncService', () => {
  beforeEach(async () => {
    cardsRepo = new InMemoryCardsRepository();
    columnsRepo = new InMemoryBoardColumnsRepository();
    sut = new TaskSyncService(cardsRepo, columnsRepo);

    const defaultColumn = await columnsRepo.create({
      boardId: 'board-1',
      title: 'A Fazer',
      position: 0,
      isDefault: true,
      isDone: false,
    });
    defaultColumnId = defaultColumn.id;

    const doneColumn = await columnsRepo.create({
      boardId: 'board-1',
      title: 'Concluído',
      position: 1,
      isDefault: false,
      isDone: true,
    });
    doneColumnId = doneColumn.id;
  });

  describe('syncFromModule', () => {
    it('should create a card when it does not exist', async () => {
      await sut.syncFromModule({
        boardId: 'board-1',
        columnId: defaultColumnId,
        tenantId: 'tenant-1',
        title: 'Tarefa do módulo HR',
        description: 'Aprovação de férias pendente',
        dueDate: new Date('2026-04-01'),
        assigneeId: 'user-2',
        reporterId: 'user-1',
        priority: 'HIGH',
        systemSourceType: 'HR_ABSENCE',
        systemSourceId: 'absence-1',
        metadata: { absenceType: 'VACATION' },
      });

      expect(cardsRepo.items).toHaveLength(1);
      expect(cardsRepo.items[0].title).toBe('Tarefa do módulo HR');
      expect(cardsRepo.items[0].systemSourceType).toBe('HR_ABSENCE');
      expect(cardsRepo.items[0].systemSourceId).toBe('absence-1');
      expect(cardsRepo.items[0].priority).toBe('HIGH');
      expect(cardsRepo.items[0].columnId.toString()).toBe(defaultColumnId);
    });

    it('should update an existing card (idempotent)', async () => {
      await sut.syncFromModule({
        boardId: 'board-1',
        columnId: defaultColumnId,
        tenantId: 'tenant-1',
        title: 'Tarefa original',
        reporterId: 'user-1',
        systemSourceType: 'FINANCE_ENTRY',
        systemSourceId: 'entry-1',
      });

      expect(cardsRepo.items).toHaveLength(1);

      await sut.syncFromModule({
        boardId: 'board-1',
        columnId: defaultColumnId,
        tenantId: 'tenant-1',
        title: 'Tarefa atualizada',
        description: 'Descrição nova',
        reporterId: 'user-1',
        priority: 'URGENT',
        systemSourceType: 'FINANCE_ENTRY',
        systemSourceId: 'entry-1',
      });

      expect(cardsRepo.items).toHaveLength(1);
      expect(cardsRepo.items[0].title).toBe('Tarefa atualizada');
      expect(cardsRepo.items[0].description).toBe('Descrição nova');
      expect(cardsRepo.items[0].priority).toBe('URGENT');
    });
  });

  describe('updateFromModule', () => {
    it('should update card fields found by system source', async () => {
      await sut.syncFromModule({
        boardId: 'board-1',
        columnId: defaultColumnId,
        tenantId: 'tenant-1',
        title: 'Tarefa original',
        reporterId: 'user-1',
        systemSourceType: 'STOCK_PO',
        systemSourceId: 'po-1',
      });

      await sut.updateFromModule({
        tenantId: 'tenant-1',
        boardId: 'board-1',
        title: 'Tarefa com título novo',
        dueDate: new Date('2026-05-01'),
        priority: 'MEDIUM',
        systemSourceType: 'STOCK_PO',
        systemSourceId: 'po-1',
      });

      expect(cardsRepo.items).toHaveLength(1);
      expect(cardsRepo.items[0].title).toBe('Tarefa com título novo');
      expect(cardsRepo.items[0].priority).toBe('MEDIUM');
      expect(cardsRepo.items[0].dueDate).toEqual(new Date('2026-05-01'));
    });

    it('should not throw if card not found', async () => {
      await expect(
        sut.updateFromModule({
          tenantId: 'tenant-1',
          boardId: 'board-1',
          title: 'Não existe',
          systemSourceType: 'HR_ABSENCE',
          systemSourceId: 'non-existent',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('completeFromModule', () => {
    it('should move card to done column and set completedAt', async () => {
      await sut.syncFromModule({
        boardId: 'board-1',
        columnId: defaultColumnId,
        tenantId: 'tenant-1',
        title: 'Tarefa para concluir',
        reporterId: 'user-1',
        systemSourceType: 'HR_ABSENCE',
        systemSourceId: 'absence-2',
      });

      expect(cardsRepo.items[0].status).toBe('OPEN');
      expect(cardsRepo.items[0].completedAt).toBeNull();

      await sut.completeFromModule('tenant-1', 'HR_ABSENCE', 'absence-2');

      expect(cardsRepo.items[0].status).toBe('DONE');
      expect(cardsRepo.items[0].completedAt).toBeInstanceOf(Date);
      expect(cardsRepo.items[0].columnId.toString()).toBe(doneColumnId);
    });

    it('should not throw if card not found', async () => {
      await expect(
        sut.completeFromModule('tenant-1', 'HR_ABSENCE', 'non-existent'),
      ).resolves.not.toThrow();
    });
  });

  describe('removeFromModule', () => {
    it('should soft delete the card', async () => {
      await sut.syncFromModule({
        boardId: 'board-1',
        columnId: defaultColumnId,
        tenantId: 'tenant-1',
        title: 'Tarefa para remover',
        reporterId: 'user-1',
        systemSourceType: 'FINANCE_ENTRY',
        systemSourceId: 'entry-2',
      });

      expect(cardsRepo.items[0].deletedAt).toBeNull();

      await sut.removeFromModule('tenant-1', 'FINANCE_ENTRY', 'entry-2');

      expect(cardsRepo.items[0].deletedAt).toBeInstanceOf(Date);
    });

    it('should not throw if card not found', async () => {
      await expect(
        sut.removeFromModule('tenant-1', 'FINANCE_ENTRY', 'non-existent'),
      ).resolves.not.toThrow();
    });
  });
});

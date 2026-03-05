import { logger } from '@/lib/logger';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';
import type { BoardColumnsRepository } from '@/repositories/tasks/board-columns-repository';

export interface SyncFromModuleParams {
  boardId: string;
  columnId: string;
  tenantId: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  assigneeId?: string | null;
  reporterId: string;
  priority?: string;
  systemSourceType: string;
  systemSourceId: string;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateFromModuleParams {
  tenantId: string;
  boardId: string;
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  assigneeId?: string | null;
  priority?: string;
  systemSourceType: string;
  systemSourceId: string;
  metadata?: Record<string, unknown> | null;
}

export class TaskSyncService {
  constructor(
    private cardsRepository: CardsRepository,
    private boardColumnsRepository: BoardColumnsRepository,
  ) {}

  async syncFromModule(params: SyncFromModuleParams): Promise<void> {
    const {
      boardId,
      columnId,
      tenantId,
      title,
      description,
      dueDate,
      assigneeId,
      reporterId,
      priority,
      systemSourceType,
      systemSourceId,
      metadata,
    } = params;

    try {
      const existing = await this.cardsRepository.findBySystemSource(
        tenantId,
        systemSourceType,
        systemSourceId,
      );

      if (existing) {
        await this.cardsRepository.update({
          id: existing.id.toString(),
          boardId: existing.boardId.toString(),
          columnId,
          title,
          description,
          dueDate,
          assigneeId,
          priority,
          metadata,
        });
      } else {
        await this.cardsRepository.create({
          boardId,
          columnId,
          title,
          description,
          dueDate,
          assigneeId,
          reporterId,
          priority,
          systemSourceType,
          systemSourceId,
          metadata,
        });
      }
    } catch (err) {
      logger.warn(
        { err, systemSourceType, systemSourceId },
        'Failed to sync card from module',
      );
    }
  }

  async updateFromModule(params: UpdateFromModuleParams): Promise<void> {
    const {
      tenantId,
      boardId,
      title,
      description,
      dueDate,
      assigneeId,
      priority,
      systemSourceType,
      systemSourceId,
      metadata,
    } = params;

    try {
      const existing = await this.cardsRepository.findBySystemSource(
        tenantId,
        systemSourceType,
        systemSourceId,
      );

      if (!existing) {
        logger.warn(
          { tenantId, systemSourceType, systemSourceId },
          'Card not found for module update',
        );
        return;
      }

      await this.cardsRepository.update({
        id: existing.id.toString(),
        boardId,
        title,
        description,
        dueDate,
        assigneeId,
        priority,
        metadata,
      });
    } catch (err) {
      logger.warn(
        { err, systemSourceType, systemSourceId },
        'Failed to update card from module',
      );
    }
  }

  async completeFromModule(
    tenantId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<void> {
    try {
      const existing = await this.cardsRepository.findBySystemSource(
        tenantId,
        sourceType,
        sourceId,
      );

      if (!existing) {
        logger.warn(
          { tenantId, sourceType, sourceId },
          'Card not found for module completion',
        );
        return;
      }

      const doneColumn = await this.boardColumnsRepository.findDoneColumn(
        existing.boardId.toString(),
      );

      await this.cardsRepository.update({
        id: existing.id.toString(),
        boardId: existing.boardId.toString(),
        status: 'DONE',
        completedAt: new Date(),
        ...(doneColumn ? { columnId: doneColumn.id } : {}),
      });
    } catch (err) {
      logger.warn(
        { err, sourceType, sourceId },
        'Failed to complete card from module',
      );
    }
  }

  async removeFromModule(
    tenantId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<void> {
    try {
      const existing = await this.cardsRepository.findBySystemSource(
        tenantId,
        sourceType,
        sourceId,
      );

      if (!existing) {
        logger.warn(
          { tenantId, sourceType, sourceId },
          'Card not found for module removal',
        );
        return;
      }

      await this.cardsRepository.softDelete(
        existing.id.toString(),
        existing.boardId.toString(),
      );
    } catch (err) {
      logger.warn(
        { err, sourceType, sourceId },
        'Failed to remove card from module',
      );
    }
  }
}

import { randomUUID } from 'node:crypto';
import type {
  BoardAutomationsRepository,
  BoardAutomationRecord,
  CreateBoardAutomationSchema,
  UpdateBoardAutomationSchema,
} from '../board-automations-repository';

export class InMemoryBoardAutomationsRepository
  implements BoardAutomationsRepository
{
  public items: BoardAutomationRecord[] = [];

  async create(
    data: CreateBoardAutomationSchema,
  ): Promise<BoardAutomationRecord> {
    const now = new Date();
    const automation: BoardAutomationRecord = {
      id: randomUUID(),
      boardId: data.boardId,
      name: data.name,
      isActive: data.isActive ?? true,
      trigger: data.trigger,
      triggerConfig: data.triggerConfig,
      action: data.action,
      actionConfig: data.actionConfig,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    this.items.push(automation);
    return automation;
  }

  async findById(
    id: string,
    boardId: string,
  ): Promise<BoardAutomationRecord | null> {
    return (
      this.items.find(
        (automation) => automation.id === id && automation.boardId === boardId,
      ) ?? null
    );
  }

  async findByBoardId(boardId: string): Promise<BoardAutomationRecord[]> {
    return this.items.filter((automation) => automation.boardId === boardId);
  }

  async findActiveByBoardAndTrigger(
    boardId: string,
    trigger: string,
  ): Promise<BoardAutomationRecord[]> {
    return this.items.filter(
      (automation) =>
        automation.boardId === boardId &&
        automation.trigger === trigger &&
        automation.isActive,
    );
  }

  async update(
    data: UpdateBoardAutomationSchema,
  ): Promise<BoardAutomationRecord | null> {
    const automation = this.items.find(
      (automation) =>
        automation.id === data.id && automation.boardId === data.boardId,
    );
    if (!automation) return null;

    if (data.name !== undefined) automation.name = data.name;
    if (data.isActive !== undefined) automation.isActive = data.isActive;
    if (data.trigger !== undefined) automation.trigger = data.trigger;
    if (data.triggerConfig !== undefined)
      automation.triggerConfig = data.triggerConfig;
    if (data.action !== undefined) automation.action = data.action;
    if (data.actionConfig !== undefined)
      automation.actionConfig = data.actionConfig;
    automation.updatedAt = new Date();

    return automation;
  }

  async delete(id: string, boardId: string): Promise<void> {
    this.items = this.items.filter(
      (automation) => !(automation.id === id && automation.boardId === boardId),
    );
  }
}

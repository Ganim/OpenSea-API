import { prisma } from '@/lib/prisma';
import type {
  AutomationAction,
  AutomationTrigger,
  Prisma,
} from '@prisma/generated/client.js';
import type {
  BoardAutomationRecord,
  BoardAutomationsRepository,
  CreateBoardAutomationSchema,
  UpdateBoardAutomationSchema,
} from '../board-automations-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): BoardAutomationRecord {
  return {
    id: raw.id,
    boardId: raw.boardId,
    name: raw.name,
    isActive: raw.isActive,
    trigger: raw.trigger,
    triggerConfig: (raw.triggerConfig as Record<string, unknown>) ?? {},
    action: raw.action,
    actionConfig: (raw.actionConfig as Record<string, unknown>) ?? {},
    createdBy: raw.createdBy,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export class PrismaBoardAutomationsRepository
  implements BoardAutomationsRepository
{
  async create(
    data: CreateBoardAutomationSchema,
  ): Promise<BoardAutomationRecord> {
    const raw = await prisma.boardAutomation.create({
      data: {
        boardId: data.boardId,
        name: data.name,
        isActive: data.isActive ?? true,
        trigger: data.trigger as AutomationTrigger,
        triggerConfig: data.triggerConfig as Prisma.InputJsonValue,
        action: data.action as AutomationAction,
        actionConfig: data.actionConfig as Prisma.InputJsonValue,
        createdBy: data.createdBy,
      },
    });

    return toRecord(raw);
  }

  async findById(
    id: string,
    boardId: string,
  ): Promise<BoardAutomationRecord | null> {
    const raw = await prisma.boardAutomation.findFirst({
      where: { id, boardId },
    });

    return raw ? toRecord(raw) : null;
  }

  async findByBoardId(boardId: string): Promise<BoardAutomationRecord[]> {
    const rows = await prisma.boardAutomation.findMany({
      where: { boardId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toRecord);
  }

  async findActiveByBoardAndTrigger(
    boardId: string,
    trigger: string,
  ): Promise<BoardAutomationRecord[]> {
    const rows = await prisma.boardAutomation.findMany({
      where: {
        boardId,
        trigger: trigger as AutomationTrigger,
        isActive: true,
      },
    });

    return rows.map(toRecord);
  }

  async update(
    data: UpdateBoardAutomationSchema,
  ): Promise<BoardAutomationRecord | null> {
    const raw = await prisma.boardAutomation.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.trigger !== undefined && {
          trigger: data.trigger as AutomationTrigger,
        }),
        ...(data.triggerConfig !== undefined && {
          triggerConfig: data.triggerConfig as Prisma.InputJsonValue,
        }),
        ...(data.action !== undefined && {
          action: data.action as AutomationAction,
        }),
        ...(data.actionConfig !== undefined && {
          actionConfig: data.actionConfig as Prisma.InputJsonValue,
        }),
      },
    });

    return toRecord(raw);
  }

  async delete(id: string, _boardId: string): Promise<void> {
    await prisma.boardAutomation.delete({
      where: { id },
    });
  }
}

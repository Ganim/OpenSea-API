import { logger } from '@/lib/logger';

export interface TaskEvent {
  type: string;
  tenantId: string;
  boardId: string;
  cardId: string;
  userId: string;
  data?: Record<string, unknown>;
}

export type TaskEventHandler = (event: TaskEvent) => void | Promise<void>;

export class TaskEventEmitter {
  private handlers = new Map<string, TaskEventHandler[]>();

  on(type: string, handler: TaskEventHandler): void {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler);
    this.handlers.set(type, existing);
  }

  off(type: string, handler: TaskEventHandler): void {
    const existing = this.handlers.get(type);
    if (!existing) return;
    this.handlers.set(
      type,
      existing.filter((h) => h !== handler),
    );
  }

  async emit(event: TaskEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        logger.warn({ err, event }, 'Task event handler failed');
      }
    }
  }
}

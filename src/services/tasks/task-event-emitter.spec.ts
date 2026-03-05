import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { logger } from '@/lib/logger';
import { TaskEventEmitter } from './task-event-emitter';
import type { TaskEvent } from './task-event-emitter';

let sut: TaskEventEmitter;

const baseEvent: TaskEvent = {
  type: 'card.completed',
  tenantId: 'tenant-1',
  boardId: 'board-1',
  cardId: 'card-1',
  userId: 'user-1',
  data: { reason: 'test' },
};

describe('TaskEventEmitter', () => {
  beforeEach(() => {
    sut = new TaskEventEmitter();
    vi.clearAllMocks();
  });

  it('should register and call a handler', async () => {
    const handler = vi.fn();
    sut.on('card.completed', handler);

    await sut.emit(baseEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(baseEvent);
  });

  it('should call multiple handlers for same event type', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    sut.on('card.completed', handler1);
    sut.on('card.completed', handler2);

    await sut.emit(baseEvent);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should not throw when emitting to unregistered type', async () => {
    await expect(
      sut.emit({ ...baseEvent, type: 'unknown.event' }),
    ).resolves.not.toThrow();
  });

  it('should remove handler with off()', async () => {
    const handler = vi.fn();
    sut.on('card.completed', handler);
    sut.off('card.completed', handler);

    await sut.emit(baseEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should catch and log handler errors without throwing', async () => {
    const error = new Error('Handler exploded');
    const failingHandler = vi.fn().mockRejectedValue(error);
    const successHandler = vi.fn();

    sut.on('card.completed', failingHandler);
    sut.on('card.completed', successHandler);

    await expect(sut.emit(baseEvent)).resolves.not.toThrow();

    expect(failingHandler).toHaveBeenCalledTimes(1);
    expect(successHandler).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      { err: error, event: baseEvent },
      'Task event handler failed',
    );
  });
});

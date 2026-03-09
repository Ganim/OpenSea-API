import { beforeEach, describe, expect, it, vi } from 'vitest';
import { domainEventBus, type DomainEvent } from './domain-events';

describe('DomainEventBus', () => {
  beforeEach(() => {
    domainEventBus.clear();
  });

  it('should call registered handler when event is emitted', async () => {
    const handler = vi.fn();
    domainEventBus.on('test.event', handler);

    const event: DomainEvent = {
      type: 'test.event',
      tenantId: 'tenant-1',
      userId: 'user-1',
      payload: { foo: 'bar' },
      occurredAt: new Date(),
    };

    await domainEventBus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should call multiple handlers for the same event', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    domainEventBus.on('test.event', handler1);
    domainEventBus.on('test.event', handler2);

    await domainEventBus.emit({
      type: 'test.event',
      tenantId: 't',
      userId: 'u',
      payload: {},
      occurredAt: new Date(),
    });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('should not call handlers for different event types', async () => {
    const handler = vi.fn();
    domainEventBus.on('other.event', handler);

    await domainEventBus.emit({
      type: 'test.event',
      tenantId: 't',
      userId: 'u',
      payload: {},
      occurredAt: new Date(),
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not throw when a handler fails', async () => {
    const failingHandler = vi.fn().mockRejectedValue(new Error('handler failed'));
    const successHandler = vi.fn();

    domainEventBus.on('test.event', failingHandler);
    domainEventBus.on('test.event', successHandler);

    await expect(
      domainEventBus.emit({
        type: 'test.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      }),
    ).resolves.toBeUndefined();

    expect(failingHandler).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
  });

  it('should clear all handlers', () => {
    domainEventBus.on('test.event', vi.fn());
    domainEventBus.on('test.event', vi.fn());

    expect(domainEventBus.handlerCount('test.event')).toBe(2);

    domainEventBus.clear();

    expect(domainEventBus.handlerCount('test.event')).toBe(0);
  });

  it('should handle events with no registered handlers gracefully', async () => {
    await expect(
      domainEventBus.emit({
        type: 'unregistered.event',
        tenantId: 't',
        userId: 'u',
        payload: {},
        occurredAt: new Date(),
      }),
    ).resolves.toBeUndefined();
  });
});

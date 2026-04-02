import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import { GetEventUseCase } from './get-event';

describe('GetEventUseCase', () => {
  let sut: GetEventUseCase;
  let eventsRepository: EsocialEventsRepository;

  beforeEach(() => {
    eventsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    sut = new GetEventUseCase(eventsRepository);
  });

  it('should throw ResourceNotFoundError if event not found', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: 'tenant-1', eventId: 'event-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should return event when found', async () => {
    const mockEvent = {
      id: { toString: () => 'event-1' },
      eventType: 'S-2200',
      status: 'DRAFT',
    } as unknown;

    vi.mocked(eventsRepository.findById).mockResolvedValue(mockEvent);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      eventId: 'event-1',
    });

    expect(result.event).toBe(mockEvent);
  });
});

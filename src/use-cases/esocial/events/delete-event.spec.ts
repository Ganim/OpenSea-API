import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import { DeleteEventUseCase } from './delete-event';

describe('DeleteEventUseCase', () => {
  let sut: DeleteEventUseCase;
  let eventsRepository: EsocialEventsRepository;

  beforeEach(() => {
    eventsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    sut = new DeleteEventUseCase(eventsRepository);
  });

  it('should throw ResourceNotFoundError if event not found', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: 'tenant-1', eventId: 'event-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if event is not DRAFT', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue({
      status: EsocialEventStatus.APPROVED,
    } as unknown);

    await expect(
      sut.execute({ tenantId: 'tenant-1', eventId: 'event-1' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should delete a DRAFT event', async () => {
    const mockEvent = {
      id: 'event-1',
      status: EsocialEventStatus.DRAFT,
    };

    vi.mocked(eventsRepository.findById).mockResolvedValue(
      mockEvent as unknown,
    );

    await sut.execute({ tenantId: 'tenant-1', eventId: 'event-1' });

    expect(eventsRepository.delete).toHaveBeenCalledWith(mockEvent.id);
  });
});

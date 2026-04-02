import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import { ReviewEventUseCase } from './review-event';

describe('ReviewEventUseCase', () => {
  let sut: ReviewEventUseCase;
  let eventsRepository: EsocialEventsRepository;

  beforeEach(() => {
    eventsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    sut = new ReviewEventUseCase(eventsRepository);
  });

  it('should throw ResourceNotFoundError if event not found', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventId: 'event-1',
        reviewedBy: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if event is not DRAFT or VALIDATED', async () => {
    vi.mocked(eventsRepository.findById).mockResolvedValue({
      status: EsocialEventStatus.APPROVED,
    } as unknown);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventId: 'event-1',
        reviewedBy: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should review a DRAFT event', async () => {
    const mockEvent = {
      status: EsocialEventStatus.DRAFT,
      markReviewed: vi.fn(),
    };

    vi.mocked(eventsRepository.findById).mockResolvedValue(
      mockEvent as unknown,
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      reviewedBy: 'user-1',
      notes: 'Looks good',
    });

    expect(mockEvent.markReviewed).toHaveBeenCalledWith('user-1', 'Looks good');
    expect(eventsRepository.save).toHaveBeenCalledWith(mockEvent);
    expect(result.event).toBe(mockEvent);
  });

  it('should review a VALIDATED event', async () => {
    const mockEvent = {
      status: EsocialEventStatus.VALIDATED,
      markReviewed: vi.fn(),
    };

    vi.mocked(eventsRepository.findById).mockResolvedValue(
      mockEvent as unknown,
    );

    await sut.execute({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      reviewedBy: 'user-1',
    });

    expect(mockEvent.markReviewed).toHaveBeenCalledWith('user-1', undefined);
  });
});
